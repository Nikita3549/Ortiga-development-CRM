import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	controllers: [SettingsController],
	providers: [SettingsService],
})
export class SettingsModule {}
