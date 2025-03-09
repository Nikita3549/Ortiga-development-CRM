import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus, Task, TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
	constructor(private readonly prisma: PrismaService) {}

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
}
