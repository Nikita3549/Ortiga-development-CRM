import {
	BadRequestException,
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Put,
	Req,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { IPublicUserData } from './interfaces/publicUserData.interface';
import { IPublicUserDataWithJwt } from '../auth/interfaces/publicUserDataWithJwt.interface';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';
import { UserService } from './user.service';
import { AuthRequest } from '../../interfaces/AuthRequest.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { TokenService } from '../token/token.service';
import { Express, Response } from 'express';
import {
	AVATAR_UPDATED_SUCCESSFUL,
	INCORRECT_USER_ID,
	UNSUPPORTED_FILE_EXTENSION,
} from './constants';
import { UploadAvatarInterceptor } from '../../interceptors/upload-avatar/upload-avatar.interceptor';
import { join } from 'path';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly tokenService: TokenService,
	) {}

	@Get()
	async getUsers(): Promise<IPublicUserData[]> {
		return this.userService.getPublicUsers();
	}

	@Get(':id')
	async getUser(@Param('id') id: string): Promise<IPublicUserData> {
		const user = await this.userService.getUserById(id);

		if (!user) {
			throw new NotFoundException(INCORRECT_USER_ID);
		}

		return user;
	}

	@Put('update')
	async updateUser(
		@Req() req: AuthRequest,
		@Body() dto: UpdateUserDto,
	): Promise<IPublicUserDataWithJwt> {
		const user = await this.userService.updateUser(req.user.uuid, dto);

		const jwt = this.tokenService.generateJWT({
			uuid: user.uuid,
			email: user.email,
			phoneNumber: user.phoneNumber,
			name: user.name,
			surname: user.surname,
			role: user.role,
		});

		return {
			userData: user,
			jwt,
		};
	}

	@Post('upload-avatar')
	@UseInterceptors(new UploadAvatarInterceptor())
	async uploadAvatar(
		@UploadedFile() file: Express.Multer.File,
		@Req() req: AuthRequest,
	) {
		if (!file) {
			throw new BadRequestException(UNSUPPORTED_FILE_EXTENSION);
		}

		await this.userService.updateAvatarPath(req.user.uuid, file.path);

		return AVATAR_UPDATED_SUCCESSFUL;
	}

	@Get('/avatar/:userUuid')
	async getAvatar(@Res() res: Response, @Param('userUuid') userUuid: string) {
		const avatarPath = await this.userService.getAvatarPath(userUuid);

		if (!avatarPath) {
			res.sendFile(join(__dirname, '../../../avatars/default.png'));
			return;
		}

		res.sendFile(avatarPath);
	}
}
