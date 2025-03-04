import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@UseGuards(JwtAuthGuard)
	@Get('hello')
	sayHello() {
		return 'hello';
	}
}
