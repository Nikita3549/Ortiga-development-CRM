import {
	OnGatewayConnection,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProjectsService } from '../projects/projects.service';
import { ProcessesService } from '../processes/processes.service';
import { TasksService } from '../tasks/tasks.service';
import { UserService } from '../user/user.service';
import { AuthSocket } from '../auth/interfaces/authSocket.interface';
import { INVALID_TOKEN } from '../chat/constants';
import { TokenService } from '../token/token.service';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { ValidationFilter } from '../chat/filters/validation.filter';
import { FindDto } from './dto/find.dto';

@UseFilters(new ValidationFilter())
@UsePipes(new ValidationPipe({ transform: true }))
@WebSocketGateway({
	namespace: '/search',
	cors: {
		origin: '*',
	},
})
export class SearchGateway implements OnGatewayConnection {
	constructor(
		private readonly projectService: ProjectsService,
		private readonly processService: ProcessesService,
		private readonly taskService: TasksService,
		private readonly userService: UserService,
		private readonly tokenService: TokenService,
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
	}
	@SubscribeMessage('projects_find')
	async handleFindProjects(client: AuthSocket, dto: FindDto) {
		const { content } = dto;

		const res = await this.projectService.searchProject(content);

		client.emit('projects_receive', res);
	}

	@SubscribeMessage('processes_find')
	async handleFindProcesses(client: AuthSocket, dto: FindDto) {
		const { content } = dto;

		const res = await this.processService.searchProcess(content);

		client.emit('processes_receive', res);
	}

	@SubscribeMessage('tasks_find')
	async handleFindTasks(client: AuthSocket, dto: FindDto) {
		const { content } = dto;

		const res = await this.taskService.searchTask(content);

		client.emit('tasks_receive', res);
	}

	@SubscribeMessage('users_find')
	async handleFindUsers(client: AuthSocket, dto: FindDto) {
		const { content } = dto;

		const res = await this.userService.searchUser(content);

		client.emit('users_receive', res);
	}
}
