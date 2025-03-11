import { TaskPriority } from '@prisma/client';
import { IsEnum, IsISO8601, IsString } from 'class-validator';

export class UpdateTaskDto {
	@IsString()
	name: string;

	@IsString()
	description: string;

	@IsEnum(TaskPriority)
	priority: TaskPriority;

	@IsISO8601()
	deadline: string;
}
