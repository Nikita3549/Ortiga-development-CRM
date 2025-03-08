import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { ConfigModule } from '../config/config.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
	imports: [ConfigModule],
	providers: [TokenService, JwtStrategy],
	exports: [TokenService],
})
export class TokenModule {}
