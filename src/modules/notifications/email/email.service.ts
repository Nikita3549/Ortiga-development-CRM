import { Injectable } from '@nestjs/common';
import { Transporter, createTransport } from 'nodemailer';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class EmailService {
	transporter: Transporter;

	constructor(private readonly config: ConfigService) {
		this.transporter = createTransport({
			host: config.get('SMTP_HOST'),
			port: +config.get('SMTP_PORT'),
			secure: !!config.get('SMTP_SECURE'),
			auth: {
				user: config.get('YANDEX_LOGIN'),
				pass: config.get('YANDEX_PASSWORD'),
			},
		});
	}

	async sendEmail(to: string, subject: string, text: string) {
		await this.transporter.sendMail({
			from: this.config.get('YANDEX_LOGIN'),
			to,
			subject,
			text,
		});
	}
}
