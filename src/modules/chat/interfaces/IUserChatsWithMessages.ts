import { Message } from '@prisma/client';

export interface IUserChatsWithMessages {
	uuid: string;
	messages: Message[];
}
