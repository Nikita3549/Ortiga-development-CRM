import { IUserSettings } from '../interfaces/IUserSettings.interface';
import { IsBoolean } from 'class-validator';

export class UserSettingsDto implements IUserSettings {
	@IsBoolean()
	darkTheme: boolean;
}
