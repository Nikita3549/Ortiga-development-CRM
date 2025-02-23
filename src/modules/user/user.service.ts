import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { ISaveUserData } from './interfaces/saveUserData.interface';
import { IPublicUserData } from './interfaces/publicUserData.interface';

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

	async saveUser(registerData: ISaveUserData): Promise<IPublicUserData> {
		return this.prisma.user.create({
			data: {
				...registerData,
				role: Role.executor,
				settings: {
					create: {},
				},
			},
			omit: {
				hashedPassword: true,
				avatarUrl: true,
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
}
