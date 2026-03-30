import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('api/v1/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    list(@CurrentUser() _user: JwtPayload) {
        return this.tasksService.list();
    }

    @Post()
    create(@CurrentUser() _user: JwtPayload, @Body() dto: CreateTaskDto) {
        return this.tasksService.create(dto);
    }

    @Patch(':taskId')
    update(
        @CurrentUser() _user: JwtPayload,
        @Param('taskId') taskId: string,
        @Body() dto: UpdateTaskDto,
    ) {
        return this.tasksService.update(taskId, dto);
    }

    @Patch(':taskId/move')
    move(
        @CurrentUser() _user: JwtPayload,
        @Param('taskId') taskId: string,
        @Body() dto: MoveTaskDto,
    ) {
        return this.tasksService.move(taskId, dto);
    }

    @Delete(':taskId')
    remove(@CurrentUser() _user: JwtPayload, @Param('taskId') taskId: string) {
        return this.tasksService.remove(taskId);
    }
}
