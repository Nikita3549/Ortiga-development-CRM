import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { NotificationException } from '../../exceptions/notification.exception';
import { Response } from 'express';

@Catch(NotificationException)
export class NotificationFilter implements ExceptionFilter {
	catch(exception: NotificationException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const res = ctx.getResponse<Response>();
		console.log(exception);

		return res.status(exception.statusCode).send({
			statusCode: exception.statusCode,
			message: exception.message,
		});
	}
}
