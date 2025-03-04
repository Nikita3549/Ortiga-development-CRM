import { Injectable } from '@nestjs/common';
import { IJwtPayload } from './interfaces/jwtPayload';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../config/config.service';

@Injectable()
export class TokenService {
	private JWT_SECRET: string;

	constructor(private readonly config: ConfigService) {
		this.JWT_SECRET = this.config.get('JWT_SECRET');
	}

	generateJWT(payload: IJwtPayload): string {
		return jwt.sign(payload, this.JWT_SECRET);
	}

	verifyJWT(JWT: string): IJwtPayload {
		return jwt.verify(JWT, this.JWT_SECRET) as IJwtPayload;
	}
}
