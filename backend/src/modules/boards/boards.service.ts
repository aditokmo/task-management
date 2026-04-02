import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddBoardMembersDto } from './dto/add-board-members.dto';
import { CreateBoardDto } from './dto/create-board.dto';

export interface BoardMemberUser {
    id: string;
    email: string;
    name: string | null;
    role: 'owner' | 'member';
}

export interface BoardMembersResponse {
    boardId: string;
    members: BoardMemberUser[];
}

interface OwnerBoardData {
    id: string;
    ownerId: string;
    owner: {
        id: string;
        email: string;
        name: string | null;
    };
    members: Array<{
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    }>;
}

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
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
            },
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        });
    }

    private normalizeMemberEmails(memberEmails: string[] | undefined): string[] {
        if (!memberEmails?.length) {
            return [];
        }

        const normalized = memberEmails
            .map((email) => email.trim().toLowerCase())
            .filter((email) => email.length > 0);

        const seen = new Set<string>();
        const duplicates = new Set<string>();

        for (const email of normalized) {
            if (seen.has(email)) {
                duplicates.add(email);
                continue;
            }

            seen.add(email);
        }

        if (duplicates.size) {
            throw new BadRequestException(
                `Duplicate emails are not allowed: ${Array.from(duplicates).join(', ')}`,
            );
        }

        return normalized;
    }

    private async getOwnerBoardOrThrow(
        userId: string,
        boardId: string,
    ): Promise<OwnerBoardData> {
        const board = await this.boardModel.findFirst({
            where: { id: boardId, ownerId: userId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                members: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!board) {
            throw new NotFoundException(
                'Board not found or you do not have permission to edit it',
            );
        }

        return board as OwnerBoardData;
    }

    private buildMembersResponse(board: OwnerBoardData): BoardMembersResponse {
        return {
            boardId: board.id,
            members: [
                {
                    id: board.owner.id,
                    email: board.owner.email,
                    name: board.owner.name,
                    role: 'owner',
                },
                ...board.members.map((membership: OwnerBoardData['members'][number]) => ({
                    id: membership.user.id,
                    email: membership.user.email,
                    name: membership.user.name,
                    role: 'member' as const,
                })),
            ],
        };
    }

    private async resolveInviteeIds(
        ownerId: string,
        ownerEmail: string,
        memberEmails: string[] | undefined,
    ) {
        const normalized = this.normalizeMemberEmails(memberEmails);

        if (!normalized.length) {
            return [] as string[];
        }

        const normalizedOwnerEmail = ownerEmail.toLowerCase();
        if (normalized.includes(normalizedOwnerEmail)) {
            throw new BadRequestException(
                'You are already the board owner and cannot be added as a member',
            );
        }

        const users = await this.prisma.user.findMany({
            where: {
                email: { in: normalized },
            },
            select: { id: true, email: true },
        });

        const usersByEmail = new Map(
            users.map((user) => [user.email.toLowerCase(), user.id]),
        );
        const missingEmails = normalized.filter(
            (email) => !usersByEmail.has(email),
        );

        if (missingEmails.length) {
            throw new BadRequestException(
                `These users do not exist: ${missingEmails.join(', ')}`,
            );
        }

        return normalized
            .map((email) => usersByEmail.get(email)!)
            .filter((id) => id !== ownerId);
    }

    private async addMembersToBoard(
        ownerId: string,
        boardId: string,
        memberEmails: string[] | undefined,
    ) {
        const board = await this.getOwnerBoardOrThrow(ownerId, boardId);
        const normalized = this.normalizeMemberEmails(memberEmails);

        if (!normalized.length) {
            return;
        }

        const existingEmails = new Set(
            board.members.map(
                (membership: OwnerBoardData['members'][number]) =>
                    membership.user.email.toLowerCase(),
            ),
        );
        const alreadyMembers = normalized.filter((email) =>
            existingEmails.has(email),
        );

        if (alreadyMembers.length) {
            throw new BadRequestException(
                `These users are already members: ${alreadyMembers.join(', ')}`,
            );
        }

        const inviteeIds = await this.resolveInviteeIds(
            ownerId,
            board.owner.email,
            normalized,
        );

        if (!inviteeIds.length) {
            return;
        }

        await this.boardMemberModel.createMany({
            data: inviteeIds.map((inviteeId) => ({ boardId, userId: inviteeId })),
            skipDuplicates: false,
        });
    }

    async create(userId: string, dto: CreateBoardDto) {
        const owner = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!owner) {
            throw new NotFoundException('User not found');
        }

        const inviteeIds = await this.resolveInviteeIds(
            userId,
            owner.email,
            dto.memberEmails,
        );

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
        const owner = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!owner) {
            throw new NotFoundException('User not found');
        }

        const inviteeIds = await this.resolveInviteeIds(
            userId,
            owner.email,
            dto.memberEmails,
        );

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
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
            },
        });

        if (!board) {
            throw new NotFoundException('Board not found');
        }

        return board;
    }

    async update(
        userId: string,
        boardId: string,
        dto: import('./dto/update-board.dto').UpdateBoardDto,
    ) {
        const board = await this.boardModel.findFirst({
            where: { id: boardId, ownerId: userId },
        });

        if (!board) {
            throw new NotFoundException(
                'Board not found or you do not have permission to edit it',
            );
        }

        const data: Record<string, unknown> = {};

        if (dto.name !== undefined) {
            data['name'] = dto.name.trim();
        }

        if (dto.memberEmails !== undefined) {
            await this.addMembersToBoard(userId, boardId, dto.memberEmails);
        }

        return this.boardModel.update({
            where: { id: boardId },
            data,
        });
    }

    async listMembers(
        userId: string,
        boardId: string,
    ): Promise<BoardMembersResponse> {
        const board = await this.getOwnerBoardOrThrow(userId, boardId);
        return this.buildMembersResponse(board);
    }

    async addMembers(
        userId: string,
        boardId: string,
        dto: AddBoardMembersDto,
    ): Promise<BoardMembersResponse> {
        await this.addMembersToBoard(userId, boardId, dto.memberEmails);
        const board = await this.getOwnerBoardOrThrow(userId, boardId);
        return this.buildMembersResponse(board);
    }

    async removeMember(userId: string, boardId: string, memberUserId: string) {
        const board = await this.getOwnerBoardOrThrow(userId, boardId);

        if (memberUserId === board.ownerId) {
            throw new BadRequestException(
                'Board owner cannot be removed from the board',
            );
        }

        const result = await this.boardMemberModel.deleteMany({
            where: {
                boardId,
                userId: memberUserId,
            },
        });

        if (result.count === 0) {
            throw new NotFoundException('Member not found in this board');
        }

        return { success: true };
    }

    async delete(userId: string, boardId: string) {
        const board = await this.boardModel.findFirst({
            where: { id: boardId, ownerId: userId },
        });

        if (!board) {
            throw new NotFoundException(
                'Board not found or you do not have permission to delete it',
            );
        }

        await this.boardMemberModel.deleteMany({
            where: { boardId },
        });

        return this.boardModel.delete({
            where: { id: boardId },
        });
    }
}
