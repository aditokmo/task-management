import { ApiService } from '@/api';
import { BoardsService } from '@/modules/boards/services';
import type { NotificationsResponse } from '../types/notification.types';
import { ENDPOINTS } from './endpoint';

export const NotificationsService = {
    list: async (): Promise<NotificationsResponse> => {
        return ApiService.get<NotificationsResponse>(ENDPOINTS.NOTIFICATIONS.LIST);
    },

    markRead: async (notificationId: string): Promise<void> => {
        await ApiService.patch<undefined, unknown>(ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
    },

    acceptInvite: async (inviteId: string) => {
        return BoardsService.acceptInvite(inviteId);
    },

    declineInvite: async (inviteId: string) => {
        return BoardsService.declineInvite(inviteId);
    },
};
