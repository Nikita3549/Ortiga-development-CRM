import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProcessesModule } from '../processes/processes.module';

@Module({
	imports: [TasksModule, ProcessesModule],
	controllers: [ProjectsController],
	providers: [ProjectsService],
})
export class ProjectsModule {}
