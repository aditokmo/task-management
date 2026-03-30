import { TaskStatus } from '@prisma/client';
import { IsEnum, IsInt, Min } from 'class-validator';

export class MoveTaskDto {
    @IsEnum(TaskStatus)
    status!: TaskStatus;

    @IsInt()
    @Min(0)
    position!: number;
}
