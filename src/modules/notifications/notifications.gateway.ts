import {
	OnGatewayConnection,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';
import {
	InternalServerErrorException,
	UseFilters,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { ValidationFilter } from '../chat/filters/validation.filter';
import { Server, Socket } from 'socket.io';
import { AuthSocket } from '../auth/interfaces/authSocket.interface';
import { INVALID_TOKEN } from '../chat/constants';
import { TokenService } from '../token/token.service';
import { NotificationsService } from './notifications.service';
import { NotificationReadDto } from './dto/notification-read.dto';
import { INVALID_NOTIFICATION_ID } from './constants';
import { UserService } from '../user/user.service';
import { Role } from '@prisma/client';
import { EmailService } from './email/email.service';

@UseFilters(new ValidationFilter())
@UsePipes(new ValidationPipe({ transform: true }))
@WebSocketGateway({
	namespace: '/notifications',
	cors: {
		origin: '*',
	},
})
export class NotificationsGateway implements OnGatewayConnection {
	constructor(
		private readonly tokenService: TokenService,
		private readonly notificationService: NotificationsService,
		private readonly userService: UserService,
		private readonly email: EmailService,
	) {}
	@WebSocketServer() server: Server;

	async handleConnection(client: Socket) {
		try {
			const token: string | undefined =
				client.handshake.auth?.token ||
				client.handshake.headers.authorization?.split(' ')[1];

			if (!token) {
				throw new Error();
			}

			const { uuid: userUuid } = this.tokenService.verifyJWT(token);

			(client as AuthSocket).data.userUuid = userUuid;

			client.join(client.data.userUuid);
		} catch (e: unknown) {
			client.emit('exception', INVALID_TOKEN);
			client.disconnect();
		}

		const unreadNotifications =
			await this.notificationService.getUnreadNotifications(
				(client as AuthSocket).data.userUuid,
			);

		for (let i = 0; i < unreadNotifications.length; i++) {
			client.emit('notification_receive', unreadNotifications[i]);
		}
	}

	@SubscribeMessage('notifications_read')
	async handleNotificationRead(client: AuthSocket, dto: NotificationReadDto) {
		const { notificationUuid } = dto;

		const notification =
			await this.notificationService.getNotificationById(
				notificationUuid,
			);

		if (!notification || notification.user != client.data.userUuid) {
			throw new WsException(INVALID_NOTIFICATION_ID);
		}

		await this.notificationService.readNotification(notificationUuid);
	}

	async sendNotification(title: string, content: string, userUuid: string) {
		const notification = await this.notificationService.createNotification(
			title,
			content,
			userUuid,
		);

		this.server.in(userUuid).emit('notification_receive', notification);

		const user = await this.userService.getUserWithSettings(userUuid);

		if (!user) {
			throw new InternalServerErrorException();
		}

		if (user.settings[0].emailSending) {
			await this.email.sendEmail(user.email, title, content);
		}
	}

	async sendNotificationToAllByRoles(
		title: string,
		content: string,
		role: Role,
	) {
		const users = await this.userService.getUsersByRole(role);

		for (let i = 0; i < users.length; i++) {
			await this.sendNotification(title, content, users[i].uuid);
		}
	}
}
