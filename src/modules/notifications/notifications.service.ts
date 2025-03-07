import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';
import {
	REGISTER_CODE_EMAIL,
	REGISTER_SUBJECT_EMAIL,
	RESET_PASSWORD_CODE_EMAIL,
	RESET_PASSWORD_SUBJECT_EMAIL,
} from './constants';

@Injectable()
export class NotificationsService {
	constructor(private readonly email: EmailService) {}

	async sendRegisterCode(email: string, code: number) {
		this.email.sendEmail(
			email,
			REGISTER_SUBJECT_EMAIL,
			REGISTER_CODE_EMAIL(code),
		);
	}

	async sendForgotPasswordCode(email: string, code: number) {
		this.email.sendEmail(
			email,
			RESET_PASSWORD_SUBJECT_EMAIL,
			RESET_PASSWORD_CODE_EMAIL(code),
		);
	}
}
