export type NotificationType = 'board_invite' | 'board_invite_accepted';

export interface NotificationItem {
    id: string;
    userId: string;
    actorId: string | null;
    boardId: string | null;
    boardMemberId: string | null;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    notifications: NotificationItem[];
    unreadCount: number;
}
