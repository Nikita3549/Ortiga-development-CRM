import { IsString, IsUUID } from 'class-validator';

export class CreateProcessDto {
	@IsUUID()
	projectUuid: string;

	@IsString()
	name: string;

	@IsString()
	description: string;
}
