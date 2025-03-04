import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { TokenModule } from '../token/token.module';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';

@Module({
	imports: [TokenModule, PrismaModule],
	providers: [ChatGateway, ChatService],
	controllers: [ChatController],
})
export class ChatModule {}
