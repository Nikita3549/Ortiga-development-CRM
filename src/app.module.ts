import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './modules/config/config.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './modules/redis/redis.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TokenModule } from './modules/token/token.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
	imports: [
		ConfigModule,
		PrismaModule,
		AuthModule,
		UserModule,
		RedisModule,
		NotificationsModule,
		TokenModule,
		SettingsModule,
		ChatModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
