import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailModule } from './email/email.module';
import { NotificationsGateway } from './notifications.gateway';
import { TokenModule } from '../token/token.module';
import { NotificationsController } from './notifications.controller';
import { UserModule } from '../user/user.module';

@Module({
	providers: [NotificationsService, NotificationsGateway],
	exports: [NotificationsService, NotificationsGateway],
	imports: [EmailModule, UserModule, TokenModule],
	controllers: [NotificationsController],
})
export class NotificationsModule {}
