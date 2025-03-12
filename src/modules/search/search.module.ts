import { Module } from '@nestjs/common';
import { SearchGateway } from './search.gateway';
import { ProjectsModule } from '../projects/projects.module';
import { ProcessesModule } from '../processes/processes.module';
import { TasksModule } from '../tasks/tasks.module';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../token/token.module';

@Module({
	imports: [
		ProjectsModule,
		ProcessesModule,
		TasksModule,
		UserModule,
		TokenModule,
	],
	providers: [SearchGateway],
})
export class SearchModule {}
