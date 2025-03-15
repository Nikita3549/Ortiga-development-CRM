import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { ISaveUserData } from './interfaces/saveUserData.interface';
import { IPublicUserData } from './interfaces/publicUserData.interface';
import { IUpdateData } from './interfaces/update-data.interface';
import { IUserWithSettings } from './interfaces/userWithSettings.interface';

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	async getUserByEmail(email: string): Promise<User | null> {
		return this.prisma.user.findFirst({
			where: {
				email,
			},
		});
	}
	async getUserById(uuid: string): Promise<IPublicUserData | null> {
		return this.prisma.user.findFirst({
			where: {
				uuid,
			},
			select: {
				uuid: true,
				email: true,
				name: true,
				surname: true,
				phoneNumber: true,
				role: true,
			},
		});
	}
	async getPublicUsers(): Promise<IPublicUserData[]> {
		return this.prisma.user.findMany({
			select: {
				uuid: true,
				email: true,
				name: true,
				surname: true,
				phoneNumber: true,
				role: true,
			},
		});
	}

	async getUserWithSettings(
		userUuid: string,
	): Promise<IUserWithSettings | null> {
		return this.prisma.user.findFirst({
			where: {
				uuid: userUuid,
			},
			include: {
				settings: true,
			},
		});
	}
	async updateUser(
		userUuid: string,
		updateData: IUpdateData,
	): Promise<IPublicUserData> {
		return this.prisma.user.update({
			data: updateData,
			where: {
				uuid: userUuid,
			},
			select: {
				uuid: true,
				email: true,
				name: true,
				surname: true,
				phoneNumber: true,
				role: true,
			},
		});
	}

	async saveUser(registerData: ISaveUserData): Promise<IPublicUserData> {
		return this.prisma.user.create({
			data: {
				...registerData,
				settings: {
					create: {},
				},
			},
			omit: {
				hashedPassword: true,
				avatarPath: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	async changePassword(email: string, newHashedPassword: string) {
		await this.prisma.user.update({
			data: {
				hashedPassword: newHashedPassword,
			},
			where: {
				email,
			},
		});
	}
	async updateAvatarPath(userUuid: string, avatarPath: string) {
		await this.prisma.user.update({
			data: {
				avatarPath,
			},
			where: {
				uuid: userUuid,
			},
		});
	}
	async getAvatarPath(userUuid: string): Promise<string | null> {
		const data = await this.prisma.user.findFirst({
			where: {
				uuid: userUuid,
			},
			select: {
				avatarPath: true,
			},
		});

		return data ? data.avatarPath : null;
	}

	async updateRole(newRole: Role, userUuid: string): Promise<User> {
		return this.prisma.user.update({
			data: {
				role: newRole,
			},
			where: {
				uuid: userUuid,
			},
		});
	}
	async searchUser(query: string): Promise<User[]> {
		return this.prisma.user.findMany({
			where: {
				OR: [
					{ name: { contains: query, mode: 'insensitive' } },
					{ surname: { contains: query, mode: 'insensitive' } },
				],
			},
		});
	}

	async getUsersByRole(role: Role) {
		return this.prisma.user.findMany({
			where: {
				role,
			},
		});
	}
}
