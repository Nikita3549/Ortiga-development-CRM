import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NotificationFilter } from './filters/notification/notification.filter';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	app.enableCors({
		origin: '*',
		methods: '*',
		credentials: true,
	});

	app.setGlobalPrefix('v1');
	app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
	app.useGlobalFilters(new NotificationFilter());

	await app.listen(process.env.API_PORT ?? 3000);
}
bootstrap();
