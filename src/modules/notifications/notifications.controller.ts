import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Req,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';
import { Notification } from '@prisma/client';
import { AuthRequest } from '../../interfaces/AuthRequest.interface';
import { NotificationsService } from './notifications.service';
import { INVALID_NOTIFICATION_ID } from './constants';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
	constructor(private readonly notificationService: NotificationsService) {}

	@Get(':id')
	async getNotification(
		@Param(':id') id: string,
		@Req() req: AuthRequest,
	): Promise<Notification> {
		const notification =
			await this.notificationService.getNotificationById(id);

		if (!notification || notification.user != req.user.uuid) {
			throw new NotFoundException(INVALID_NOTIFICATION_ID);
		}

		return notification;
	}

	@Get()
	async getNotifications(@Req() req: AuthRequest) {
		return this.notificationService.getAllNotifications(req.user.uuid);
	}
}
