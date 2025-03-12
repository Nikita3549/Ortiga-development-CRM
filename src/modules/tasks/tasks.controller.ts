import {
	Body,
	ConflictException,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	Patch,
	Post,
	Put,
	Query,
	Req,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';
import { IsControllerGuard } from '../../guards/isController.guard';
import {
	AttachedMessage,
	AttachedMessageType,
	Role,
	Task,
	TaskExecutors,
	TaskStatus,
} from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';
import { ProcessesService } from '../processes/processes.service';
import {
	EXECUTOR_ALREADY_ASSIGNED,
	INVALID_EXECUTOR,
	INVALID_FILE_ID,
	INVALID_PROCESS_ID,
	INVALID_TASK_ID,
	TASK_ALREADY_COMPLETED,
} from './constants';
import { UserService } from '../user/user.service';
import { AuthRequest } from '../../interfaces/AuthRequest.interface';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ITaskWithExecutors } from './interfaces/taskWithExecutors.interface';
import { AttachMessageDto } from './dto/attach-message.dto';
import { AttachFileInterceptor } from './interceptors/attach-file.interceptor';
import { Express, Response } from 'express';
import { join } from 'path';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
	constructor(
		private readonly taskService: TasksService,
		private readonly processesService: ProcessesService,
		private readonly userService: UserService,
	) {}

	@Post('create')
	@UseGuards(IsControllerGuard)
	async createTask(
		@Body() dto: CreateTaskDto,
		@Req() req: AuthRequest,
	): Promise<ITaskWithExecutors> {
		const {
			name,
			deadline,
			priority,
			processUuid,
			executorUuid,
			description,
		} = dto;

		const deadlineObj = new Date(deadline);

		const process = await this.processesService.getProcessById(processUuid);

		if (!process) {
			throw new NotFoundException(INVALID_PROCESS_ID);
		}

		const user = await this.userService.getUserById(executorUuid);

		if (!user || user.role != Role.EXECUTOR) {
			throw new NotFoundException(INVALID_EXECUTOR);
		}

		return this.taskService.createTask(
			name,
			description,
			deadlineObj,
			priority,
			req.user.uuid,
			process.project,
			processUuid,
			executorUuid,
		);
	}

	@Put('/update/:id')
	@UseGuards(IsControllerGuard)
	async updateTask(
		@Param('id') id: string,
		@Body() dto: UpdateTaskDto,
	): Promise<Task> {
		const { name, deadline, priority, description } = dto;
		const deadlineObj = new Date(deadline);

		if (!(await this.taskService.doesTaskExist(id))) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		return this.taskService.updateTask(
			name,
			deadlineObj,
			priority,
			description,
			id,
		);
	}

	@Get(':id')
	async getTask(@Param('id') id: string): Promise<ITaskWithExecutors> {
		const task = await this.taskService.getTaskById(id);

		if (!task) {
			throw new NotFoundException(INVALID_TASK_ID);
		}
		return task;
	}

	@Get()
	async getTasks(
		@Query('processUuid') processUuid?: string,
	): Promise<ITaskWithExecutors[]> {
		return this.taskService.getTasksByProcessId(processUuid);
	}

	@Delete(':id')
	@UseGuards(IsControllerGuard)
	async deleteTask(@Param('id') id: string) {
		await this.taskService.deleteTask(id);
	}

	@Patch('/:id/complete')
	@UseGuards(IsControllerGuard)
	async completeTask(@Param('id') id: string): Promise<Task> {
		const task = await this.taskService.getTaskById(id);

		if (!task) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		const newTaskStatus =
			task.status == TaskStatus.IN_PROCESS
				? TaskStatus.COMPLETED
				: task.status == TaskStatus.IN_PROCESS_LATE
					? TaskStatus.COMPLETED_LATE
					: null;

		if (!newTaskStatus) {
			throw new ConflictException(TASK_ALREADY_COMPLETED);
		}

		return this.taskService.updateTaskStatus(newTaskStatus, id);
	}

	@Post('/:taskUuid/executor/:executorUuid')
	@UseGuards(IsControllerGuard)
	async addExecutor(
		@Param('taskUuid') taskUuid: string,
		@Param('executorUuid') executorUuid: string,
	): Promise<TaskExecutors> {
		const task = await this.taskService.getTaskById(taskUuid);
		const executor = await this.userService.getUserById(executorUuid);

		if (!task) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		if (!executor || executor.role != Role.EXECUTOR) {
			throw new NotFoundException(INVALID_EXECUTOR);
		}

		if (await this.taskService.getExecutor(taskUuid, executorUuid)) {
			throw new ConflictException(EXECUTOR_ALREADY_ASSIGNED);
		}

		return this.taskService.createExecutor(taskUuid, executorUuid);
	}

	@Delete('/:taskUuid/executor/:executorUuid')
	@UseGuards(IsControllerGuard)
	async deleteTaskExecutor(
		@Param('taskUuid') taskUuid: string,
		@Param('executorUuid') executorUuid: string,
	) {
		const task = await this.taskService.getTaskById(taskUuid);
		const executor = await this.userService.getUserById(executorUuid);

		if (!task) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		if (!executor || executor.role != Role.EXECUTOR) {
			throw new NotFoundException(INVALID_EXECUTOR);
		}

		await this.taskService.deleteExecutor(taskUuid, executorUuid);
	}
	@Post('/:taskUuid/attach/message')
	async attachMessage(
		@Param('taskUuid') taskUuid: string,
		@Body() dto: AttachMessageDto,
		@Req() req: AuthRequest,
	): Promise<AttachedMessage> {
		const { content } = dto;

		if (!(await this.taskService.doesTaskExist(taskUuid))) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		return this.taskService.attachMessage(content, req.user.uuid, taskUuid);
	}

	@Post('/:taskUuid/attach/file')
	@UseInterceptors(new AttachFileInterceptor())
	async attachFile(
		@Param('taskUuid') taskUuid: string,
		@UploadedFile() file: Express.Multer.File,
		@Req() req: AuthRequest,
	): Promise<AttachedMessage> {
		const content = file.filename;
		console.log(content);

		if (!(await this.taskService.doesTaskExist(taskUuid))) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		return this.taskService.attachFile(content, req.user.uuid, taskUuid);
	}

	@Get('/attach/file/:fileUuid')
	async getAttachedFile(
		@Param('fileUuid') fileUuid: string,
		@Res() res: Response,
	) {
		const attachedFile =
			await this.taskService.getAttachedFileById(fileUuid);

		if (!attachedFile || attachedFile.type != AttachedMessageType.FILE) {
			throw new NotFoundException(INVALID_FILE_ID);
		}

		res.sendFile(
			join(__dirname, `../../../attachedFiles/${attachedFile.content}`),
		);
	}

	@Get('/attach/message/:messageUuid')
	async getAttachedMessage(
		@Param('messageUuid') messageUuid: string,
	): Promise<AttachedMessage> {
		const attachedMessage =
			await this.taskService.getAttachedFileById(messageUuid);

		if (!attachedMessage) {
			throw new NotFoundException(INVALID_FILE_ID);
		}

		return attachedMessage;
	}
	@Get('/:taskUuid/attach/message')
	async getAttachedMessages(
		@Param('taskUuid') taskUuid: string,
	): Promise<AttachedMessage[]> {
		const task = await this.taskService.getTaskById(taskUuid);

		if (!task) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		return this.taskService.getAllAttachedFilesByTaskUuid(taskUuid);
	}
}
