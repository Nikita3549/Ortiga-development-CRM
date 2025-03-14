import { forwardRef, Module } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { ProcessesController } from './processes.controller';
import { TasksModule } from '../tasks/tasks.module';
import { UserModule } from '../user/user.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
	imports: [forwardRef(() => TasksModule), UserModule, NotificationsModule],
	providers: [ProcessesService],
	exports: [ProcessesService],
	controllers: [ProcessesController],
})
export class ProcessesModule {}
