import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Chat, Message, MessageRead } from '@prisma/client';
import { IUserChatsWithMessages } from './interfaces/IUserChatsWithMessages';

@Injectable()
export class ChatService {
	constructor(private readonly prisma: PrismaService) {}

	async getUnreadMessages(userId: string): Promise<Message[]> {
		return this.prisma.message.findMany({
			where: {
				senderId: { not: userId },
				messagesRead: {
					none: {
						senderId: userId,
					},
				},
			},
		});
	}
	async createChat(firstUserId: string, secondUserId: string): Promise<Chat> {
		return this.prisma.chat.create({
			data: {
				members: {
					createMany: {
						data: [
							{ userId: firstUserId },
							{ userId: secondUserId },
						],
					},
				},
			},
		});
	}

	async getUserChats(userId: string): Promise<Chat[]> {
		return this.prisma.chat.findMany({
			where: {
				members: {
					some: {
						userId,
					},
				},
			},
		});
	}

	async createMessage(
		chatId: string,
		senderId: string,
		content: string,
	): Promise<Message> {
		return this.prisma.message.create({
			data: {
				chatId,
				senderId,
				content,
			},
		});
	}
	async createMessageRead(
		messageId: string,
		userId: string,
	): Promise<MessageRead> {
		return this.prisma.messageRead.create({
			data: {
				senderId: userId,
				messageId,
			},
		});
	}
	async getAllChatsWithMessages(
		userId: string,
	): Promise<IUserChatsWithMessages[]> {
		return this.prisma.chat.findMany({
			where: {
				members: {
					some: {
						userId: userId,
					},
				},
			},
			select: {
				uuid: true,
				messages: {
					select: {
						uuid: true,
						senderId: true,
						chatId: true,
						content: true,
						createdAt: true,
					},
					orderBy: {
						createdAt: 'asc',
					},
				},
			},
		});
	}
}
