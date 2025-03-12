import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Process, ProcessStatus, ProjectStatus, Task } from '@prisma/client';

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

	async createProcess(
		projectUuid: string,
		name: string,
		description: string,
		userUuid: string,
	): Promise<Process> {
		return this.prisma.process.create({
			data: {
				project: projectUuid,
				name,
				description,
				createdBy: userUuid,
			},
		});
	}

	async updateProcess(
		name: string,
		description: string,
		processUuid: string,
	): Promise<Process> {
		return this.prisma.process.update({
			data: {
				name,
				description,
			},
			where: {
				uuid: processUuid,
			},
		});
	}
	async getProcessById(processUuid: string): Promise<Process | null> {
		return this.prisma.process.findFirst({
			where: {
				uuid: processUuid,
			},
		});
	}
	async getProcessesByStatus(status?: ProcessStatus): Promise<Process[]> {
		return this.prisma.process.findMany({
			where: status ? { status } : {},
		});
	}

	async deleteProcess(processUuid: string) {
		return this.prisma.process.deleteMany({
			where: {
				uuid: processUuid,
			},
		});
	}

	async doesProcessExist(processUuid: string): Promise<boolean> {
		return !!(await this.prisma.process.findFirst({
			where: {
				uuid: processUuid,
			},
		}));
	}

	async updateProcessStatus(
		status: ProcessStatus,
		processUuid: string,
	): Promise<Process> {
		return this.prisma.process.update({
			data: {
				status,
			},
			where: {
				uuid: processUuid,
			},
		});
	}

	async searchProcess(query: string): Promise<Process[]> {
		return this.prisma.process.findMany({
			where: {
				name: {
					contains: query,
					mode: 'insensitive',
				},
			},
		});
	}
}
