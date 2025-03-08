import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guards/jwtAuth.guard';
import { IsControllerGuard } from './guards/isController.guard';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@UseGuards(JwtAuthGuard, IsControllerGuard)
	@Get('hello')
	sayHello() {
		return 'hello';
	}
}
