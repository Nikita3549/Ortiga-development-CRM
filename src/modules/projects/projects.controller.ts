import {
	BadRequestException,
	Body,
	Controller,
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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProcessStatus, Project, ProjectStatus, Role } from '@prisma/client';
import { AuthRequest } from '../../interfaces/AuthRequest.interface';
import { INVALID_PROJECT_ID, UNCOMPLETED_PROCESSES } from './constants';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { ProcessesService } from '../processes/processes.service';
import { TasksService } from '../tasks/tasks.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { IsControllerGuard } from '../../guards/isController.guard';
import { NEW_PROJECT_TO_ADMINS_CONTENT } from '../notifications/constants/notifications.content';
import { NEW_PROJECT_TO_ADMINS_TITLE } from '../notifications/constants/notification.titles';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
	constructor(
		private readonly projectService: ProjectsService,
		private readonly processesService: ProcessesService,
		private readonly tasksService: TasksService,
		private readonly notifications: NotificationsGateway,
	) {}

	@UseGuards(IsControllerGuard)
	@Post('create')
	async createProject(
		@Body() dto: CreateProjectDto,
		@Req() req: AuthRequest,
	): Promise<Project> {
		const { name, description } = dto;

		const project = await this.projectService.createProject(
			name,
			description,
			req.user.uuid,
		);

		await this.notifications.sendNotificationToAllByRoles(
			NEW_PROJECT_TO_ADMINS_TITLE,
			NEW_PROJECT_TO_ADMINS_CONTENT(name),
			Role.ADMIN,
		);

		return project;
	}

	@Get()
	async getAllProjects(
		@Query() dto: GetProjectsQueryDto,
	): Promise<Project[]> {
		const { status } = dto;

		return this.projectService.getAllProjectsByStatus(status);
	}

	@Get(':id')
	async getProject(@Param('id') id: string): Promise<Project> {
		const project = await this.projectService.getProject(id);

		if (!project) {
			throw new NotFoundException(INVALID_PROJECT_ID);
		}

		return project;
	}

	@Put('/update/:id')
	@UseGuards(IsControllerGuard)
	async updateProject(
		@Param('id') id: string,
		@Body() dto: UpdateProjectDto,
	): Promise<Project> {
		const { name, description } = dto;

		return await this.projectService
			.updateProject(name, description, id)
			.catch(() => {
				throw new NotFoundException(INVALID_PROJECT_ID);
			});
	}

	@Patch('/:id/complete')
	@UseGuards(IsControllerGuard)
	async completeProject(@Param('id') id: string): Promise<Project> {
		const uncompletedProcesses =
			await this.processesService.getAllProcessesByStatus(
				ProcessStatus.IN_PROCESS,
			);

		if (uncompletedProcesses.length != 0) {
			throw new BadRequestException(UNCOMPLETED_PROCESSES);
		}

		return await this.updateStatus(ProjectStatus.COMPLETED, id);
	}

	@Patch('/:id/close')
	@UseGuards(IsControllerGuard)
	async closeProject(@Param('id') id: string) {
		await this.updateStatus(ProjectStatus.CLOSED, id);

		this.tasksService.closeTasks(id);

		this.processesService.closeProcesses(id);
	}

	@Patch('/:id/reopen')
	@UseGuards(IsControllerGuard)
	async reopenProject(@Param('id') id: string) {
		await this.updateStatus(ProjectStatus.IN_PROCESS, id);

		this.tasksService.reopenTasks(id);

		this.processesService.reopenProcesses(id);
	}

	private async updateStatus(status: ProjectStatus, id: string) {
		return await this.projectService.updateStatus(status, id).catch(() => {
			throw new NotFoundException(INVALID_PROJECT_ID);
		});
	}
}
