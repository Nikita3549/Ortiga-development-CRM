import { Injectable } from '@nestjs/common';
import { IUserSettings } from './interfaces/IUserSettings.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
	constructor(private readonly prisma: PrismaService) {}

	async getSettings(userUuid: string): Promise<IUserSettings | null> {
		return this.prisma.userSettings.findUnique({
			where: {
				userUuid,
			},
			omit: {
				userUuid: true,
			},
		});
	}

	async updateSettings(userUuid: string, newSettings: IUserSettings) {
		return this.prisma.userSettings.update({
			data: newSettings,
			where: {
				userUuid,
			},
		});
	}
}
