import { TaskPriority, TaskStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    @MinLength(3)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(TaskPriority)
    priority!: TaskPriority;

    @IsEnum(TaskStatus)
    status!: TaskStatus;

    @IsDateString()
    dueDate!: string;

    @IsOptional()
    @IsString()
    assigneeId?: string;

    @IsOptional()
    @IsString()
    assigneeName?: string;
}
