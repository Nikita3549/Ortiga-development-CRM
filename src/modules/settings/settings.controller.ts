import {
	Body,
	Controller,
	Get,
	Put,
	Req,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { IUserSettings } from './interfaces/IUserSettings.interface';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthRequest } from '../../interfaces/AuthRequest.interface';
import { UserSettingsDto } from './dto/user-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
	constructor(private readonly settingsService: SettingsService) {}

	@Get()
	async getSettings(@Req() req: AuthRequest): Promise<IUserSettings> {
		const settings = await this.settingsService.getSettings(req.user.uuid);

		if (!settings) {
			throw new UnauthorizedException();
		}

		return settings;
	}

	@Put('update')
	async updateSettings(
		@Req() req: AuthRequest,
		@Body() dto: UserSettingsDto,
	) {
		await this.settingsService.updateSettings(req.user.uuid, dto);
	}
}
