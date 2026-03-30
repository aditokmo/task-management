import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TaskGateway } from '../realtime/task.gateway';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly taskGateway: TaskGateway,
    ) { }

    async list() {
        const tasks = await this.prisma.task.findMany({
            orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
        });

        return tasks;
    }

    async create(dto: CreateTaskDto) {
        const nextPosition = await this.prisma.task.count({ where: { status: dto.status } });

        const task = await this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description ?? '',
                priority: dto.priority,
                status: dto.status,
                dueDate: new Date(dto.dueDate),
                assigneeId: dto.assigneeId,
                position: nextPosition,
            },
        });

        this.taskGateway.emitTaskCreated(task);
        return task;
    }

    async update(taskId: string, dto: UpdateTaskDto) {
        await this.ensureTaskExists(taskId);

        const payload: Prisma.TaskUpdateInput = {
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.position !== undefined ? { position: dto.position } : {}),
            ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
            ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
        };

        const task = await this.prisma.task.update({
            where: { id: taskId },
            data: payload,
        });

        this.taskGateway.emitTaskUpdated(task);
        return task;
    }

    async move(taskId: string, dto: MoveTaskDto) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const sourceStatus = task.status;
        const destinationStatus = dto.status;

        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const sourceColumn = await tx.task.findMany({
                where: {
                    status: sourceStatus,
                    id: { not: taskId },
                },
                orderBy: { position: 'asc' },
            });

            const destinationColumn =
                sourceStatus === destinationStatus
                    ? sourceColumn
                    : await tx.task.findMany({
                        where: {
                            status: destinationStatus,
                            id: { not: taskId },
                        },
                        orderBy: { position: 'asc' },
                    });

            const targetIndex = Math.min(Math.max(dto.position, 0), destinationColumn.length);

            if (sourceStatus !== destinationStatus) {
                for (let index = 0; index < sourceColumn.length; index += 1) {
                    await tx.task.update({
                        where: { id: sourceColumn[index].id },
                        data: { position: index },
                    });
                }
            }

            const reorderedDestination = [...destinationColumn];
            reorderedDestination.splice(targetIndex, 0, {
                ...task,
                status: destinationStatus,
            });

            for (let index = 0; index < reorderedDestination.length; index += 1) {
                await tx.task.update({
                    where: { id: reorderedDestination[index].id },
                    data: {
                        status: destinationStatus,
                        position: index,
                    },
                });
            }
        });

        const updatedTask = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!updatedTask) {
            throw new NotFoundException('Task not found after move');
        }

        this.taskGateway.emitTaskMoved(updatedTask);
        return updatedTask;
    }

    async remove(taskId: string) {
        await this.ensureTaskExists(taskId);
        await this.prisma.task.delete({ where: { id: taskId } });
        this.taskGateway.emitTaskDeleted(taskId);
        return { success: true };
    }

    private async ensureTaskExists(taskId: string) {
        const task = await this.prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            throw new NotFoundException('Task not found');
        }

        return task;
    }
}
