import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../interfaces/AuthRequest.interface';
import { Role } from '@prisma/client';

export class IsAdminGuard implements CanActivate {
	canActivate(ctx: ExecutionContext): boolean {
		const host = ctx.switchToHttp();
		const req: AuthRequest = host.getRequest();

		return req.user.role == Role.ADMIN;
	}
}
