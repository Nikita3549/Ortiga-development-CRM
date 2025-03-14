import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
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
import { ProcessesService } from './processes.service';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';
import { IsControllerGuard } from '../../guards/isController.guard';
import { CreateProcessDto } from './dto/create-process.dto';
import { Process, ProcessStatus, Role } from '@prisma/client';
import { AuthRequest } from '../../interfaces/AuthRequest.interface';
import {
	COMPLETE_TASKS_BEFORE,
	INVALID_CONTROLLER,
	INVALID_PROCESS_ID,
	INVALID_PROJECT_ID,
} from './constants';
import { UpdateProcessDto } from './dto/update-process.dto';
import { GetProcessesQueryDto } from './dto/get-processes-query.dto';
import { TasksService } from '../tasks/tasks.service';
import { UserService } from '../user/user.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
	ATTACH_MESSAGE_TO_ADMINS_CONTENT,
	COMPLETE_PROCESS_STATUS_TO_ADMINS_CONTENT,
	NEW_PROCESS_TO_ADMINS_CONTENT,
	NEW_PROCESS_TO_CONTROLLER_CONTENT,
} from '../notifications/constants/notifications.content';
import {
	ATTACH_MESSAGE_TO_ADMINS_TITLE,
	COMPLETE_PROCESS_STATUS_TO_ADMINS_TITLE,
	NEW_PROCESS_TO_ADMINS_TITLE,
	NEW_PROCESS_TO_CONTROLLER_TITLE,
} from '../notifications/constants/notification.titles';

@Controller('processes')
@UseGuards(JwtAuthGuard)
export class ProcessesController {
	constructor(
		private readonly processesService: ProcessesService,
		private readonly taskService: TasksService,
		private readonly userService: UserService,
		private readonly notifications: NotificationsGateway,
	) {}

	@Post('create')
	@UseGuards(IsControllerGuard)
	async createProcess(
		@Body() dto: CreateProcessDto,
		@Req() req: AuthRequest,
	): Promise<Process> {
		const { projectUuid, name, description, controllerUuid } = dto;

		const controller = await this.userService.getUserById(controllerUuid);

		if (!controller || controller.role != Role.CONTROLLER) {
			throw new NotFoundException(INVALID_CONTROLLER);
		}

		const process = await this.processesService
			.createProcess(projectUuid, name, description, controllerUuid)
			.catch(() => {
				throw new NotFoundException(INVALID_PROJECT_ID);
			});

		if (req.user.role != Role.ADMIN) {
			await this.notifications.sendNotificationToAllByRoles(
				NEW_PROCESS_TO_ADMINS_TITLE,
				NEW_PROCESS_TO_ADMINS_CONTENT(name),
				Role.ADMIN,
			);
		}

		await this.notifications.sendNotification(
			NEW_PROCESS_TO_CONTROLLER_TITLE,
			NEW_PROCESS_TO_CONTROLLER_CONTENT(process.name),
			controllerUuid,
		);

		return process;
	}

	@Put('/update/:id')
	@UseGuards(IsControllerGuard)
	async updateProcess(
		@Param('id') id: string,
		@Body() dto: UpdateProcessDto,
	): Promise<Process> {
		const { name, description } = dto;

		return this.processesService
			.updateProcess(name, description, id)
			.catch(() => {
				throw new NotFoundException(INVALID_PROCESS_ID);
			});
	}

	@Get(':id')
	async getProcess(@Param('id') id: string): Promise<Process> {
		const process = await this.processesService.getProcessById(id);

		if (!process) {
			throw new NotFoundException(INVALID_PROCESS_ID);
		}

		return process;
	}

	@Get()
	async getAllProcess(
		@Query() dto: GetProcessesQueryDto,
	): Promise<Process[]> {
		const { status } = dto;

		return this.processesService.getProcessesByStatus(status);
	}

	@Delete(':id')
	@UseGuards(IsControllerGuard)
	async deleteProcess(@Param('id') id: string) {
		await this.processesService.deleteProcess(id);
	}

	@Patch('/:id/complete')
	@UseGuards(IsControllerGuard)
	async completeProcess(@Param('id') id: string): Promise<Process> {
		if (!(await this.processesService.doesProcessExist(id))) {
			throw new NotFoundException(INVALID_PROCESS_ID);
		}

		const inProcessTasks = await this.taskService.getAllInProcessTasks(id);

		if (inProcessTasks.length != 0) {
			throw new ForbiddenException(COMPLETE_TASKS_BEFORE);
		}

		const process = await this.processesService.updateProcessStatus(
			ProcessStatus.COMPLETED,
			id,
		);

		await this.notifications.sendNotificationToAllByRoles(
			COMPLETE_PROCESS_STATUS_TO_ADMINS_TITLE,
			COMPLETE_PROCESS_STATUS_TO_ADMINS_CONTENT(process.name),
			Role.ADMIN,
		);

		return process;
	}

	@Get('/:id/progress')
	async getProgress(@Param('id') id: string): Promise<{ progress: number }> {
		if (!(await this.processesService.doesProcessExist(id))) {
			throw new NotFoundException(INVALID_PROCESS_ID);
		}

		const tasks = await this.taskService.getAllUnclosedTasks(id);

		const completedTasks = await this.taskService.getAllCompletedTasks(id);

		if (tasks.length == 0) {
			return { progress: 0 };
		}

		const progress = (completedTasks.length / tasks.length) * 100;

		return { progress };
	}
}
