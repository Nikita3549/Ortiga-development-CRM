import { IsString } from 'class-validator';

export class AttachMessageDto{
	@IsString()
	content: string
}