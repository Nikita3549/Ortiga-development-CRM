import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
	async sendRegisterCode(email: string, code: number) {
		console.log(`register code - ${code}`);
	}

	async sendForgotPasswordCode(email: string, code: number) {
		console.log(`forgot password code - ${code}`);
	}
}
