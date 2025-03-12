import { IsString } from 'class-validator';

export class FindDto {
	@IsString()
	content: string;
}
