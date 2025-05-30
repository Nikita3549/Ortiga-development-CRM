import { TaskPriority } from '@prisma/client';
import { IsEnum, IsISO8601, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
	@IsUUID()
	processUuid: string;

	@IsString()
	name: string;

	@IsString()
	description: string;

	@IsUUID()
	executorUuid: string;

	@IsUUID()
	controllerUuid: string;

	@IsEnum(TaskPriority)
	priority: TaskPriority;

	@IsISO8601()
	deadline: string;
}
