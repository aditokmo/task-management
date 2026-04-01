import {
    BadRequestException,
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

    async list(userId: string, boardId: string) {
        if (!boardId) {
            throw new BadRequestException('boardId is required');
        }

        await this.ensureBoardOwnedByUser(userId, boardId);

        return this.prisma.task.findMany({
            where: { boardId },
            orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
        });
    }

    async create(userId: string, dto: CreateTaskDto) {
        await this.ensureBoardOwnedByUser(userId, dto.boardId);

        const nextPosition = await this.prisma.task.count({
            where: {
                boardId: dto.boardId,
                status: dto.status,
            },
        });

        const task = await this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description ?? '',
                priority: dto.priority,
                status: dto.status,
                dueDate: new Date(dto.dueDate),
                boardId: dto.boardId,
                assigneeId: dto.assigneeId,
                position: nextPosition,
            },
        });

        this.taskGateway.emitTaskCreated(task);
        return task;
    }

    async update(userId: string, taskId: string, dto: UpdateTaskDto) {
        await this.ensureTaskExists(taskId, userId);

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

    async move(userId: string, taskId: string, dto: MoveTaskDto) {
        const task = await this.ensureTaskExists(taskId, userId);
        if (!task.boardId) {
            throw new BadRequestException('Task has no board assigned');
        }

        const sourceStatus = task.status;
        const destinationStatus = dto.status;
        const boardId = task.boardId;

        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const sourceColumn = await tx.task.findMany({
                where: {
                    boardId,
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
                            boardId,
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

    async remove(userId: string, taskId: string) {
        await this.ensureTaskExists(taskId, userId);
        await this.prisma.task.delete({ where: { id: taskId } });
        this.taskGateway.emitTaskDeleted(taskId);
        return { success: true };
    }

    private async ensureBoardOwnedByUser(userId: string, boardId: string) {
        if (!boardId) {
            throw new BadRequestException('boardId is required');
        }

        const board = await this.prisma.board.findFirst({
            where: {
                id: boardId,
                ownerId: userId,
            },
        });

        if (!board) {
            throw new NotFoundException('Board not found');
        }

        return board;
    }

    private async ensureTaskExists(taskId: string, userId: string) {
        const task = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                board: {
                    ownerId: userId,
                },
            },
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        return task;
    }
}
