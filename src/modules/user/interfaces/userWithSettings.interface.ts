import { User, UserSettings } from '@prisma/client';

export interface IUserWithSettings extends User {
	settings: UserSettings[];
}
