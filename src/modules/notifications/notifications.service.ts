import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';
import {
	REGISTER_CODE_EMAIL,
	REGISTER_SUBJECT_EMAIL,
	RESET_PASSWORD_CODE_EMAIL,
	RESET_PASSWORD_SUBJECT_EMAIL,
} from './constants';
import { PrismaService } from '../prisma/prisma.service';
import { Notification, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
	constructor(
		private readonly email: EmailService,
		private readonly prisma: PrismaService,
	) {}

	async sendRegisterCode(email: string, code: number) {
		this.email.sendEmail(
			email,
			REGISTER_SUBJECT_EMAIL,
			REGISTER_CODE_EMAIL(code),
		);
	}

	async sendForgotPasswordCode(email: string, code: number) {
		this.email.sendEmail(
			email,
			RESET_PASSWORD_SUBJECT_EMAIL,
			RESET_PASSWORD_CODE_EMAIL(code),
		);
	}

	async createNotification(
		title: string,
		content: string,
		to: string,
	): Promise<Notification> {
		return this.prisma.notification.create({
			data: {
				title,
				content,
				user: to,
				status: NotificationStatus.UNREAD,
			},
		});
	}
	async getUnreadNotifications(userUuid: string): Promise<Notification[]> {
		return this.prisma.notification.findMany({
			where: {
				user: userUuid,
				status: NotificationStatus.UNREAD,
			},
		});
	}
	async getAllNotifications(userUuid: string): Promise<Notification[]> {
		return this.prisma.notification.findMany({
			where: {
				user: userUuid,
			},
		});
	}

	async getNotificationById(
		notificationUuid: string,
	): Promise<Notification | null> {
		return this.prisma.notification.findFirst({
			where: {
				uuid: notificationUuid,
			},
		});
	}

	async readNotification(notificationUuid: string): Promise<Notification> {
		return this.prisma.notification.update({
			data: {
				status: NotificationStatus.READ,
			},
			where: {
				uuid: notificationUuid,
			},
		});
	}
}
