import { Module } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	providers: [ProcessesService],
	exports: [ProcessesService],
})
export class ProcessesModule {}
