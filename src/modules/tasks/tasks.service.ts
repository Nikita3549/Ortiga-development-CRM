import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

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
}
