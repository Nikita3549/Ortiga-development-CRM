import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Project, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
	constructor(private readonly prisma: PrismaService) {}

	async createProject(
		name: string,
		description: string,
		userUuid: string,
	): Promise<Project> {
		return this.prisma.project.create({
			data: {
				name,
				description,
				createdBy: userUuid,
			},
		});
	}

	async getAllProjectsByStatus(status?: ProjectStatus): Promise<Project[]> {
		return this.prisma.project.findMany({
			where: status ? { status } : {},
		});
	}

	async getProject(id: string): Promise<Project | null> {
		return this.prisma.project.findFirst({
			where: {
				uuid: id,
			},
		});
	}

	async updateProject(
		name: string,
		description: string,
		id: string,
	): Promise<Project> {
		return this.prisma.project.update({
			data: {
				name,
				description,
			},
			where: {
				uuid: id,
			},
		});
	}
	async updateStatus(status: ProjectStatus, id: string): Promise<Project> {
		return this.prisma.project.update({
			data: {
				status,
			},
			where: {
				uuid: id,
			},
		});
	}

	async searchProject(query: string): Promise<Project[]> {
		return this.prisma.project.findMany({
			where: {
				name: {
					contains: query,
					mode: 'insensitive',
				},
			},
		});
	}
}
