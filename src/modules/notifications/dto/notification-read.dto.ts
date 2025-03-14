import { IsUUID } from 'class-validator';

export class NotificationReadDto {
	@IsUUID()
	notificationUuid: string;
}
