import { IsEnum, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
	@IsUUID()
	userUuid: string;

	@IsEnum(Role)
	newRole: Role;
}
