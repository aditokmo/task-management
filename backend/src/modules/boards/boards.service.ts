import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';

@Injectable()
export class BoardsService {
    constructor(private readonly prisma: PrismaService) { }

    private get boardModel() {
        return (this.prisma as any).board;
    }

    private get boardMemberModel() {
        return (this.prisma as any).boardMember;
    }

    async list(userId: string) {
        return this.boardModel.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } },
                ],
            },
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        });
    }

    private async resolveInviteeIds(ownerId: string, memberEmails: string[] | undefined) {
        if (!memberEmails?.length) {
            return [] as string[];
        }

        const normalized = Array.from(
            new Set(
                memberEmails
                    .map((email) => email.trim().toLowerCase())
                    .filter((email) => email.length > 0),
            ),
        );

        if (!normalized.length) {
            return [] as string[];
        }

        const users = await this.prisma.user.findMany({
            where: {
                email: { in: normalized },
            },
            select: { id: true },
        });

        return users.map((user) => user.id).filter((id) => id !== ownerId);
    }

    async create(userId: string, dto: CreateBoardDto) {
        const inviteeIds = await this.resolveInviteeIds(userId, dto.memberEmails);

        return this.boardModel.create({
            data: {
                name: dto.name.trim(),
                ownerId: userId,
                members: inviteeIds.length
                    ? {
                        createMany: {
                            data: inviteeIds.map((inviteeId) => ({ userId: inviteeId })),
                        },
                    }
                    : undefined,
            },
        });
    }

    async open(userId: string, dto: CreateBoardDto) {
        const normalizedName = dto.name.trim();
        const inviteeIds = await this.resolveInviteeIds(userId, dto.memberEmails);

        const existingBoard = await this.boardModel.findFirst({
            where: {
                ownerId: userId,
                name: {
                    equals: normalizedName,
                    mode: 'insensitive',
                },
            },
        });

        if (existingBoard) {
            if (inviteeIds.length) {
                await this.boardMemberModel.createMany({
                    data: inviteeIds.map((inviteeId) => ({
                        boardId: existingBoard.id,
                        userId: inviteeId,
                    })),
                    skipDuplicates: true,
                });
            }

            return existingBoard;
        }

        return this.boardModel.create({
            data: {
                name: normalizedName,
                ownerId: userId,
                members: inviteeIds.length
                    ? {
                        createMany: {
                            data: inviteeIds.map((inviteeId) => ({ userId: inviteeId })),
                        },
                    }
                    : undefined,
            },
        });
    }

    async getById(userId: string, boardId: string) {
        const board = await this.boardModel.findFirst({
            where: {
                id: boardId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } },
                ],
            },
        });

        if (!board) {
            throw new NotFoundException('Board not found');
        }

        return board;
    }
}
