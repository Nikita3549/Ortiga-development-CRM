import { UserSettings } from '@prisma/client';

export interface IUserSettings extends Omit<UserSettings, 'userUuid'> {}
