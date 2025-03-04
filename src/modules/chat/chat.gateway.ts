import {
	OnGatewayConnection,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthSocket } from '../auth/interfaces/authSocket.interface';
import { TokenService } from '../token/token.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import {
	INVALID_CHAT_ID,
	INVALID_MESSAGE_ID,
	INVALID_TOKEN,
	INVALID_USER_ID,
	MESSAGE_ACK_SUCCESSFUL,
} from './constants';
import { MessageReadDto } from './dto/message-read.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { ValidationFilter } from './filters/validation.filter';

@WebSocketGateway({
	namespace: '/chat',
	cors: {
		origin: '*',
	},
})
@UseFilters(new ValidationFilter())
@UsePipes(new ValidationPipe({ transform: true }))
export class ChatGateway implements OnGatewayConnection {
	constructor(
		private readonly tokenService: TokenService,
		private readonly chatService: ChatService,
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
		} catch (e: unknown) {
			client.emit('exception', INVALID_TOKEN);
			client.disconnect();
		}

		const clientChats = await this.chatService.getUserChats(
			client.data.userUuid,
		);

		for (let i = 0; i < clientChats.length; i++) {
			client.join(`chat_${clientChats[i].uuid}`);
		}

		const unreadMessages = await this.chatService.getUnreadMessages(
			client.data.userUuid,
		);

		for (let i = 0; i < unreadMessages.length; i++) {
			client.emit('message_receive', unreadMessages[i]);
		}
	}

	@SubscribeMessage('new_chat')
	async handleNewChat(client: AuthSocket, dto: CreateChatDto) {
		const { secondChatUser } = dto;

		if (client.data.userUuid == secondChatUser) {
			throw new WsException(INVALID_CHAT_ID);
		}

		await this.chatService
			.createChat(client.data.userUuid, secondChatUser)
			.catch((_e: unknown) => {
				throw new WsException(INVALID_USER_ID);
			});

		client.emit('new_chat', 'Successful created');
	}
	@SubscribeMessage('message_send')
	async handleSendMessage(client: AuthSocket, dto: SendMessageDto) {
		let { chatId, content } = dto;

		const message = await this.chatService
			.createMessage(chatId, client.data.userUuid, content)
			.catch((e: unknown) => {
				throw new WsException(INVALID_CHAT_ID);
			});

		client.emit('message_ack', MESSAGE_ACK_SUCCESSFUL(message.uuid));

		client.broadcast.to(`chat_${chatId}`).emit('message_receive', message);
	}
	@SubscribeMessage('message_read')
	async handleMessageRead(client: AuthSocket, dto: MessageReadDto) {
		const { messageId } = dto;

		await this.chatService
			.createMessageRead(messageId, client.data.userUuid)
			.catch((e: unknown) => {
				throw new WsException(INVALID_MESSAGE_ID);
			});

		client.broadcast
			.to(`chat_${dto.chatId}`)
			.emit('message_read', messageId);
	}
}
