import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { TokenModule } from '../token/token.module';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
	imports: [TokenModule, PrismaModule, RedisModule],
	providers: [ChatGateway, ChatService],
	controllers: [ChatController],
})
export class ChatModule {}
