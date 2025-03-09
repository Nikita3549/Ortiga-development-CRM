import { IsString } from 'class-validator';

export class UpdateProcessDto {
	@IsString()
	name: string;

	@IsString()
	description: string;
}
