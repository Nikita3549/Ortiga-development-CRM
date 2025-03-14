import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TasksModule } from '../tasks/tasks.module';
import { ProcessesModule } from '../processes/processes.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
	imports: [TasksModule, ProcessesModule, NotificationsModule],
	controllers: [ProjectsController],
	providers: [ProjectsService],
	exports: [ProjectsService],
})
export class ProjectsModule {}
