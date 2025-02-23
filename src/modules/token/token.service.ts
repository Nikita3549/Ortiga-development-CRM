import { Injectable } from '@nestjs/common';
import { IJwtPayload } from './interfaces/jwtPayload';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../config/config.service';

@Injectable()
export class TokenService {
	constructor(private readonly config: ConfigService) {}

	generateJWT(payload: IJwtPayload): string {
		return jwt.sign(payload, this.config.get('JWT_SECRET'));
	}
}
