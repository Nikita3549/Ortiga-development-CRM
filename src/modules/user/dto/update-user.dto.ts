import { IsPhoneNumber, IsString } from 'class-validator';

export class UpdateUserDto {
	@IsString()
	name: string;

	@IsString()
	surname: string;

	@IsPhoneNumber()
	phoneNumber: string;
}
