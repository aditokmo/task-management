/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddBoardMembersDto } from './dto/add-board-members.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

export interface BoardMemberUser {
    id: string;
    email: string;
    name: string | null;
    role: 'owner' | 'member';
    status: 'pending' | 'accepted' | 'declined';
}

export interface BoardMembersResponse {
    boardId: string;
    members: BoardMemberUser[];
}

interface OwnerBoardData {
    id: string;
    name: string;
    ownerId: string;
    owner: {
        id: string;
        email: string;
        name: string | null;
    };
    members: Array<{
        id: string;
        status: 'pending' | 'accepted' | 'declined';
        userId: string;
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    }>;
}

interface ResolvedInvitee {
    id: string;
    email: string;
    name: string | null;
}

@Injectable()
export class BoardsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
        private readonly mailService: MailService,
    ) { }

    private get boardModel() {
        return (this.prisma as any).board;
    }

    private get boardMemberModel() {
        return (this.prisma as any).boardMember;
    }

    private get notificationModel() {
        return (this.prisma as any).notification;
    }

    list(userId: string): Promise<unknown[]> {
        return this.boardModel.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId, status: 'accepted' } } },
                ],
            },
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        }) as Promise<unknown[]>;
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
                    status: 'accepted',
                },
                ...board.members.map(
                    (membership: OwnerBoardData['members'][number]) => ({
                        id: membership.user.id,
                        email: membership.user.email,
                        name: membership.user.name,
                        role: 'member' as const,
                        status: membership.status,
                    }),
                ),
            ],
        };
    }

    private async resolveInvitees(
        ownerId: string,
        ownerEmail: string,
        memberEmails: string[] | undefined,
    ): Promise<ResolvedInvitee[]> {
        const normalized = this.normalizeMemberEmails(memberEmails);

        if (!normalized.length) {
            return [];
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
            select: { id: true, email: true, name: true },
        });

        const usersByEmail = new Map(
            users.map((user) => [
                user.email.toLowerCase(),
                {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            ]),
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
            .filter((user) => user.id !== ownerId);
    }

    private async inviteMembersToBoard(
        ownerId: string,
        boardId: string,
        memberEmails: string[] | undefined,
    ) {
        const board = await this.getOwnerBoardOrThrow(ownerId, boardId);
        const invitees = await this.resolveInvitees(
            ownerId,
            board.owner.email,
            memberEmails,
        );

        if (!invitees.length) {
            return;
        }

        const existingMembersByEmail = new Map(
            board.members.map((membership: OwnerBoardData['members'][number]) => [
                membership.user.email.toLowerCase(),
                membership,
            ]),
        );

        const ownerName = board.owner.name || board.owner.email;

        for (const invitee of invitees) {
            const existingMembership = existingMembersByEmail.get(
                invitee.email.toLowerCase(),
            );

            if (existingMembership?.status === 'accepted') {
                throw new BadRequestException(
                    `These users are already members: ${invitee.email}`,
                );
            }

            if (existingMembership?.status === 'pending') {
                throw new BadRequestException(
                    `These users already have a pending invite: ${invitee.email}`,
                );
            }

            let membershipId = existingMembership?.id;

            if (existingMembership?.status === 'declined') {
                const updatedMembership = await this.boardMemberModel.update({
                    where: { id: existingMembership.id },
                    data: {
                        status: 'pending',
                        invitedById: ownerId,
                        respondedAt: null,
                    },
                });
                membershipId = updatedMembership.id;
            } else {
                const createdMembership = await this.boardMemberModel.create({
                    data: {
                        boardId,
                        userId: invitee.id,
                        invitedById: ownerId,
                        status: 'pending',
                    },
                });
                membershipId = createdMembership.id;
            }

            if (!membershipId) {
                throw new BadRequestException('Unable to create invite membership');
            }

            await this.notificationModel.deleteMany({
                where: {
                    userId: invitee.id,
                    type: 'board_invite',
                    boardMemberId: membershipId,
                },
            });

            await this.notificationsService.createBoardInviteNotification({
                userId: invitee.id,
                actorId: ownerId,
                boardId,
                boardMemberId: membershipId,
                boardName: board.name,
                actorName: ownerName,
            });

            await this.mailService.sendBoardInviteEmail({
                toEmail: invitee.email,
                boardName: board.name,
                ownerDisplayName: ownerName,
            });
        }
    }

    async create(userId: string, dto: CreateBoardDto) {
        const board = await this.boardModel.create({
            data: {
                name: dto.name.trim(),
                ownerId: userId,
            },
        });

        if (dto.memberEmails?.length) {
            await this.inviteMembersToBoard(userId, board.id, dto.memberEmails);
        }

        return board;
    }

    async open(userId: string, dto: CreateBoardDto) {
        const normalizedName = dto.name.trim();

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
            if (dto.memberEmails?.length) {
                await this.inviteMembersToBoard(
                    userId,
                    existingBoard.id,
                    dto.memberEmails,
                );
            }
            return existingBoard;
        }

        return this.create(userId, { ...dto, name: normalizedName });
    }

    async getById(userId: string, boardId: string) {
        const board = await this.boardModel.findFirst({
            where: {
                id: boardId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId, status: 'accepted' } } },
                ],
            },
        });

        if (!board) {
            throw new NotFoundException('Board not found');
        }

        return board;
    }

    async update(userId: string, boardId: string, dto: UpdateBoardDto) {
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
            await this.inviteMembersToBoard(userId, boardId, dto.memberEmails);
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
        await this.inviteMembersToBoard(userId, boardId, dto.memberEmails);
        const board = await this.getOwnerBoardOrThrow(userId, boardId);
        return this.buildMembersResponse(board);
    }

    async acceptInvite(userId: string, inviteId: string) {
        const invite = await this.boardMemberModel.findFirst({
            where: {
                id: inviteId,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                board: {
                    include: {
                        owner: {
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

        if (!invite || invite.status !== 'pending') {
            throw new NotFoundException('Invite not found');
        }

        await this.boardMemberModel.update({
            where: { id: invite.id },
            data: {
                status: 'accepted',
                respondedAt: new Date(),
            },
        });

        await this.notificationModel.updateMany({
            where: {
                userId,
                boardMemberId: invite.id,
                type: 'board_invite',
            },
            data: { isRead: true },
        });

        const actorName = invite.user.name || invite.user.email;
        await this.notificationsService.createInviteAcceptedNotification({
            userId: invite.board.owner.id,
            actorId: invite.user.id,
            boardId: invite.boardId,
            boardMemberId: invite.id,
            boardName: invite.board.name,
            actorName,
        });

        await this.mailService.sendInviteAcceptedEmail({
            toEmail: invite.board.owner.email,
            boardName: invite.board.name,
            invitedUserDisplayName: actorName,
        });

        return { success: true };
    }

    async declineInvite(userId: string, inviteId: string) {
        const invite = await this.boardMemberModel.findFirst({
            where: {
                id: inviteId,
                userId,
            },
        });

        if (!invite || invite.status !== 'pending') {
            throw new NotFoundException('Invite not found');
        }

        await this.boardMemberModel.update({
            where: { id: invite.id },
            data: {
                status: 'declined',
                respondedAt: new Date(),
            },
        });

        await this.notificationModel.updateMany({
            where: {
                userId,
                boardMemberId: invite.id,
                type: 'board_invite',
            },
            data: { isRead: true },
        });

        return { success: true };
    }

    async removeMember(userId: string, boardId: string, memberUserId: string) {
        const board = await this.getOwnerBoardOrThrow(userId, boardId);

        if (memberUserId === board.ownerId) {
            throw new BadRequestException(
                'Board owner cannot be removed from the board',
            );
        }

        const existingMembership = await this.boardMemberModel.findFirst({
            where: {
                boardId,
                userId: memberUserId,
            },
            select: { id: true },
        });

        if (!existingMembership) {
            throw new NotFoundException('Member not found in this board');
        }

        await this.notificationModel.deleteMany({
            where: { boardMemberId: existingMembership.id },
        });

        await this.boardMemberModel.delete({
            where: { id: existingMembership.id },
        });

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
