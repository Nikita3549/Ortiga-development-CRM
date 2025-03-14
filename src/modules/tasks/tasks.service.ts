import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
	AttachedMessage,
	AttachedMessageType,
	Project,
	ProjectStatus,
	Role,
	Task,
	TaskExecutors,
	TaskPriority,
	TaskStatus,
} from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ITaskWithExecutors } from './interfaces/taskWithExecutors.interface';
import {
	COMPLETE_TASK_TO_EXECUTORS_TITLE,
	LATE_TASK_STATUS_TO_ADMINS_TITLE,
	LATE_TASK_TO_EXECUTORS_TITLE,
} from '../notifications/constants/notification.titles';
import {
	COMPLETE_TASK_TO_EXECUTORS_CONTENT,
	LATE_TASK_STATUS_TO_ADMINS_CONTENT,
	LATE_TASK_TO_EXECUTORS_CONTENT,
} from '../notifications/constants/notifications.content';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class TasksService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notifications: NotificationsGateway,
	) {}

	async createTask(
		name: string,
		description: string,
		deadline: Date,
		priority: TaskPriority,
		userUuid: string,
		projectUuid: string,
		processUuid: string,
		executorUuid: string,
	): Promise<ITaskWithExecutors> {
		return this.prisma.task.create({
			data: {
				name,
				description,
				deadline,
				priority,
				createdBy: userUuid,
				project: projectUuid,
				process: processUuid,
				executors: {
					create: {
						executorUuid,
					},
				},
			},
			include: {
				executors: true,
			},
		});
	}
	async closeTasks(projectUuid: string) {
		await this.prisma.task.updateMany({
			data: {
				status: ProjectStatus.CLOSED,
			},
			where: {
				project: projectUuid,
			},
		});
	}

	async getTaskById(taskUuid: string): Promise<ITaskWithExecutors | null> {
		return this.prisma.task.findFirst({
			where: {
				uuid: taskUuid,
			},
			include: {
				executors: true,
			},
		});
	}

	async getTasksByProcessId(
		processUuid?: string,
	): Promise<ITaskWithExecutors[]> {
		return this.prisma.task.findMany({
			where: processUuid ? { process: processUuid } : {},
			include: {
				executors: true,
			},
		});
	}

	async deleteTask(taskUuid: string) {
		await this.prisma.task.deleteMany({
			where: {
				uuid: taskUuid,
			},
		});
	}

	async updateTaskStatus(
		status: TaskStatus,
		taskUuid: string,
	): Promise<Task> {
		return this.prisma.task.update({
			data: {
				status,
			},
			where: {
				uuid: taskUuid,
			},
		});
	}

	async reopenTasks(projectUuid: string) {
		await this.prisma.task.updateMany({
			data: {
				status: ProjectStatus.IN_PROCESS,
			},
			where: {
				project: projectUuid,
			},
		});
	}

	async getAllInProcessTasks(processUuid: string): Promise<Task[]> {
		return this.prisma.task.findMany({
			where: {
				status: {
					in: [TaskStatus.IN_PROCESS, TaskStatus.IN_PROCESS_LATE],
				},
				process: processUuid,
			},
		});
	}
	async getAllCompletedTasks(processUuid: string): Promise<Task[]> {
		return this.prisma.task.findMany({
			where: {
				status: {
					in: [TaskStatus.COMPLETED, TaskStatus.COMPLETED_LATE],
				},
				process: processUuid,
			},
		});
	}

	async getAllUnclosedTasks(processUuid: string): Promise<Task[]> {
		return this.prisma.task.findMany({
			where: {
				process: processUuid,
				status: {
					not: TaskStatus.CLOSED,
				},
			},
		});
	}

	async updateTask(
		name: string,
		deadline: Date,
		priority: TaskPriority,
		description: string,
		taskUuid: string,
	): Promise<Task> {
		return this.prisma.task.update({
			data: {
				name,
				deadline,
				priority,
				description,
			},
			where: {
				uuid: taskUuid,
			},
		});
	}

	async doesTaskExist(taskUuid: string): Promise<boolean> {
		return !!(await this.prisma.task.findFirst({
			where: {
				uuid: taskUuid,
			},
		}));
	}

	async createExecutor(
		taskUuid: string,
		executorUuid: string,
	): Promise<TaskExecutors> {
		return this.prisma.taskExecutors.create({
			data: {
				taskUuid,
				executorUuid,
			},
		});
	}

	async deleteExecutor(taskUuid: string, executorUuid: string) {
		await this.prisma.taskExecutors.deleteMany({
			where: {
				taskUuid,
				executorUuid,
			},
		});
	}

	async getExecutor(
		taskUuid: string,
		executorUuid: string,
	): Promise<TaskExecutors | null> {
		return this.prisma.taskExecutors.findFirst({
			where: {
				taskUuid,
				executorUuid,
			},
		});
	}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async checkDeadlines() {
		const startDate = new Date();
		startDate.setHours(0, 0, 0, 0);

		const endDate = new Date();
		endDate.setDate(endDate.getDate() + 1);
		endDate.setHours(0, 0, 0, 0);

		const lateTasks = await this.prisma.task.findMany({
			where: {
				deadline: {
					gte: startDate,
					lt: endDate,
				},
			},
		});

		for (const task of lateTasks) {
			if (task.status == TaskStatus.IN_PROCESS) {
				const updatedTask = await this.prisma.task.update({
					data: {
						status: TaskStatus.IN_PROCESS_LATE,
					},
					where: {
						uuid: task.uuid,
					},
					include: {
						executors: true,
					},
				});

				await this.notifications.sendNotificationToAllByRoles(
					LATE_TASK_STATUS_TO_ADMINS_TITLE,
					LATE_TASK_STATUS_TO_ADMINS_CONTENT(task.name),
					Role.ADMIN,
				);

				for (let i = 0; i < updatedTask.executors.length; i++) {
					await this.notifications.sendNotification(
						LATE_TASK_TO_EXECUTORS_TITLE,
						LATE_TASK_TO_EXECUTORS_CONTENT(updatedTask.name),
						updatedTask.executors[i].executorUuid,
					);
				}
			}
		}
	}

	async attachMessage(
		content: string,
		userUuid: string,
		taskUuid: string,
	): Promise<AttachedMessage> {
		return this.prisma.attachedMessage.create({
			data: {
				type: AttachedMessageType.TEXT,
				content,
				createdBy: userUuid,
				taskUuid,
			},
		});
	}

	async attachFile(
		fileName: string,
		userUuid: string,
		taskUuid: string,
	): Promise<AttachedMessage> {
		return this.prisma.attachedMessage.create({
			data: {
				type: AttachedMessageType.FILE,
				content: fileName,
				createdBy: userUuid,
				taskUuid,
			},
		});
	}

	async getAttachedFileById(
		fileUuid: string,
	): Promise<AttachedMessage | null> {
		return this.prisma.attachedMessage.findFirst({
			where: {
				uuid: fileUuid,
			},
		});
	}

	async getAllAttachedFilesByTaskUuid(
		taskUuid: string,
	): Promise<AttachedMessage[]> {
		return this.prisma.attachedMessage.findMany({
			where: {
				taskUuid,
			},
		});
	}

	async searchTask(query: string): Promise<Task[]> {
		return this.prisma.task.findMany({
			where: {
				name: {
					contains: query,
					mode: 'insensitive',
				},
			},
		});
	}
}
