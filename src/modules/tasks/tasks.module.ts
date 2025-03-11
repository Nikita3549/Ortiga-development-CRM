import { forwardRef, Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ProcessesModule } from '../processes/processes.module';
import { UserModule } from '../user/user.module';

console.log(ProcessesModule);

@Module({
	imports: [forwardRef(() => ProcessesModule), UserModule],
	providers: [TasksService],
	exports: [TasksService],
	controllers: [TasksController],
})
export class TasksModule {}
