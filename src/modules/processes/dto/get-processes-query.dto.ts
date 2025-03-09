import { ProcessStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class GetProcessesQueryDto {
	@IsOptional()
	@IsEnum(ProcessStatus)
	status?: ProcessStatus;
}
