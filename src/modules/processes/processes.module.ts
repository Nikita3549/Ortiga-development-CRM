import { Module } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProcessesController } from './processes.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
	imports: [TasksModule],
	providers: [ProcessesService],
	exports: [ProcessesService],
	controllers: [ProcessesController],
})
export class ProcessesModule {}
