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
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';
import { IsControllerGuard } from '../../guards/isController.guard';
import { Role, Task, TaskExecutors, TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';
import { ProcessesService } from '../processes/processes.service';
import {
	EXECUTOR_ALREADY_ASSIGNED,
	INVALID_EXECUTOR,
	INVALID_PROCESS_ID,
	INVALID_TASK_ID,
	TASK_ALREADY_COMPLETED,
} from './constants';
import { UserService } from '../user/user.service';
import { AuthRequest } from '../../interfaces/AuthRequest.interface';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ITaskWithExecutors } from './interfaces/taskWithExecutors.interface';

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
}
