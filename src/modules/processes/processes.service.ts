import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Process, ProcessStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProcessesService {
	constructor(private readonly prisma: PrismaService) {}

	async closeProcesses(projectUuid: string) {
		await this.prisma.process.updateMany({
			data: {
				status: ProjectStatus.CLOSED,
			},
			where: {
				project: projectUuid,
			},
		});
	}
	async reopenProcesses(projectUuid: string) {
		await this.prisma.process.updateMany({
			data: {
				status: ProjectStatus.IN_PROCESS,
			},
			where: {
				project: projectUuid,
			},
		});
	}

	async getAllProcessesByStatus(status?: ProcessStatus): Promise<Process[]> {
		return this.prisma.process.findMany({
			where: status ? { status } : {},
		});
	}
}
