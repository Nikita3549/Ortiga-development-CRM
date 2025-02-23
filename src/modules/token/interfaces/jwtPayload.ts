import { Role } from '@prisma/client';

export interface IJwtPayload {
	uuid: string;
	email: string;
	name: string;
	surname: string;
	phoneNumber: string;
	role: Role;
}
