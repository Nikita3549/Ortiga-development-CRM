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
	INVALID_CONTROLLER,
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
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
	ASSIGN_TO_TASK_TO_EXECUTOR_TITLE,
	ATTACH_FILE_TO_ADMINS_TITLE,
	ATTACH_FILE_TO_CONTROLLER_TITLE,
	ATTACH_FILE_TO_EXECUTORS_TITLE,
	ATTACH_MESSAGE_TO_ADMINS_TITLE,
	ATTACH_MESSAGE_TO_CONTROLLER_TITLE,
	ATTACH_MESSAGE_TO_EXECUTORS_TITLE,
	COMPLETE_TASK_TO_ADMINS_TITLE,
	COMPLETE_TASK_TO_CONTROLLER_TITLE,
	COMPLETE_TASK_TO_EXECUTORS_TITLE,
	NEW_TASK_TO_ADMINS_TITLE,
	NEW_TASK_TO_CONTROLLER_TITLE,
} from '../notifications/constants/notification.titles';
import {
	ASSIGN_TO_TASK_TO_EXECUTOR_CONTENT,
	ATTACH_FILE_TO_ADMINS_CONTENT,
	ATTACH_FILE_TO_CONTROLLER_CONTENT,
	ATTACH_FILE_TO_EXECUTORS_CONTENT,
	ATTACH_MESSAGE_TO_ADMINS_CONTENT,
	ATTACH_MESSAGE_TO_CONTROLLER_CONTENT,
	ATTACH_MESSAGE_TO_EXECUTORS_CONTENT,
	COMPLETE_TASK_TO_ADMINS_CONTENT,
	COMPLETE_TASK_TO_CONTROLLER_CONTENT,
	COMPLETE_TASK_TO_EXECUTORS_CONTENT,
	NEW_TASK_TO_ADMINS_CONTENT,
	NEW_TASK_TO_CONTROLLER_CONTENT,
} from '../notifications/constants/notifications.content';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
	constructor(
		private readonly taskService: TasksService,
		private readonly processesService: ProcessesService,
		private readonly userService: UserService,
		private readonly notifications: NotificationsGateway,
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
			controllerUuid,
		} = dto;

		const controller = await this.userService.getUserById(controllerUuid);

		if (!controller || controller.role != Role.CONTROLLER) {
			throw new NotFoundException(INVALID_CONTROLLER);
		}

		const deadlineObj = new Date(deadline);

		const process = await this.processesService.getProcessById(processUuid);

		if (!process) {
			throw new NotFoundException(INVALID_PROCESS_ID);
		}

		const user = await this.userService.getUserById(executorUuid);

		if (!user || user.role != Role.EXECUTOR) {
			throw new NotFoundException(INVALID_EXECUTOR);
		}

		const task = await this.taskService.createTask(
			name,
			description,
			deadlineObj,
			priority,
			controllerUuid,
			process.project,
			processUuid,
			executorUuid,
		);

		if (req.user.role != Role.ADMIN) {
			await this.notifications.sendNotificationToAllByRoles(
				NEW_TASK_TO_ADMINS_TITLE,
				NEW_TASK_TO_ADMINS_CONTENT(name),
				Role.ADMIN,
			);
		}

		await this.notifications.sendNotification(
			NEW_TASK_TO_CONTROLLER_TITLE,
			NEW_TASK_TO_CONTROLLER_CONTENT(task.name),
			controllerUuid,
		);

		await this.notifications.sendNotification(
			ASSIGN_TO_TASK_TO_EXECUTOR_TITLE,
			ASSIGN_TO_TASK_TO_EXECUTOR_CONTENT(task.name),
			task.executors[0].executorUuid,
		);

		return task;
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
	async completeTask(
		@Param('id') id: string,
		@Req() req: AuthRequest,
	): Promise<Task> {
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

		const updatedTask = await this.taskService.updateTaskStatus(
			newTaskStatus,
			id,
		);

		if (req.user.role != Role.ADMIN) {
			await this.notifications.sendNotificationToAllByRoles(
				COMPLETE_TASK_TO_ADMINS_TITLE,
				COMPLETE_TASK_TO_ADMINS_CONTENT(updatedTask.name),
				Role.ADMIN,
			);
		}

		await this.notifications.sendNotification(
			COMPLETE_TASK_TO_CONTROLLER_TITLE,
			COMPLETE_TASK_TO_CONTROLLER_CONTENT(task.name),
			task.createdBy,
		);

		for (let i = 0; i < task.executors.length; i++) {
			await this.notifications.sendNotification(
				COMPLETE_TASK_TO_EXECUTORS_TITLE,
				COMPLETE_TASK_TO_EXECUTORS_CONTENT(task.name),
				task.executors[i].executorUuid,
			);
		}

		return updatedTask;
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

		await this.notifications.sendNotification(
			ASSIGN_TO_TASK_TO_EXECUTOR_TITLE,
			ASSIGN_TO_TASK_TO_EXECUTOR_CONTENT(task.name),
			executor.uuid,
		);

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

		const task = await this.taskService.getTaskById(taskUuid);

		if (!task) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		if (req.user.role != Role.ADMIN) {
			await this.notifications.sendNotificationToAllByRoles(
				ATTACH_MESSAGE_TO_ADMINS_TITLE,
				ATTACH_MESSAGE_TO_ADMINS_CONTENT(task.name),
				Role.ADMIN,
			);
		}

		await this.notifications.sendNotification(
			ATTACH_MESSAGE_TO_CONTROLLER_TITLE,
			ATTACH_MESSAGE_TO_CONTROLLER_CONTENT(task.name),
			task.createdBy,
		);

		for (let i = 0; i < task.executors.length; i++) {
			await this.notifications.sendNotification(
				ATTACH_MESSAGE_TO_EXECUTORS_TITLE,
				ATTACH_MESSAGE_TO_EXECUTORS_CONTENT(task.name),
				task.executors[i].executorUuid,
			);
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

		const task = await this.taskService.getTaskById(taskUuid);

		if (!task) {
			throw new NotFoundException(INVALID_TASK_ID);
		}

		if (req.user.role != Role.ADMIN) {
			await this.notifications.sendNotificationToAllByRoles(
				ATTACH_FILE_TO_ADMINS_TITLE,
				ATTACH_FILE_TO_ADMINS_CONTENT(task.name),
				Role.ADMIN,
			);
		}

		await this.notifications.sendNotification(
			ATTACH_FILE_TO_CONTROLLER_TITLE,
			ATTACH_FILE_TO_CONTROLLER_CONTENT(task.name),
			task.createdBy,
		);

		for (let i = 0; i < task.executors.length; i++) {
			await this.notifications.sendNotification(
				ATTACH_FILE_TO_EXECUTORS_TITLE,
				ATTACH_FILE_TO_EXECUTORS_CONTENT(task.name),
				task.executors[i].executorUuid,
			);
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
