/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private get notificationModel() {
    return (this.prisma as any).notification;
  }

  async list(userId: string) {
    const notifications = await this.notificationModel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await this.notificationModel.count({
      where: { userId, isRead: false },
    });

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationModel.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.notificationModel.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  createBoardInviteNotification(params: {
    userId: string;
    actorId: string;
    boardId: string;
    boardMemberId: string;
    boardName: string;
    actorName: string;
  }) {
    return this.notificationModel.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        boardId: params.boardId,
        boardMemberId: params.boardMemberId,
        type: 'board_invite',
        title: 'Board invitation',
        message: `${params.actorName} invited you to join ${params.boardName}.`,
      },
    });
  }

  createInviteAcceptedNotification(params: {
    userId: string;
    actorId: string;
    boardId: string;
    boardMemberId: string;
    boardName: string;
    actorName: string;
  }) {
    return this.notificationModel.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        boardId: params.boardId,
        boardMemberId: params.boardMemberId,
        type: 'board_invite_accepted',
        title: 'Invite accepted',
        message: `${params.actorName} accepted your invite to ${params.boardName}.`,
      },
    });
  }
}
