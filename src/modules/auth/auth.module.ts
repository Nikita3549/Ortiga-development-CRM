import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TokenModule } from '../token/token.module';
import { PassportModule } from '@nestjs/passport';

@Module({
	imports: [
		UserModule,
		RedisModule,
		NotificationsModule,
		TokenModule,
		PassportModule,
	],
	providers: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
