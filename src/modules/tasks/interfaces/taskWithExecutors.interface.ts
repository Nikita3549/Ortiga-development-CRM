import { Task, TaskExecutors } from '@prisma/client';

export interface ITaskWithExecutors extends Task{
	executors: TaskExecutors[]
}