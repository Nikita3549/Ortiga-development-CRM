import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class GetProjectsQueryDto {
	@IsOptional()
	@IsEnum(ProjectStatus)
	status?: ProjectStatus;
}
