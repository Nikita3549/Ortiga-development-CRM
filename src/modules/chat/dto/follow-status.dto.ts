import { IsString } from 'class-validator';

export class FollowStatusDto {
	@IsString()
	userUuid: string;
}
