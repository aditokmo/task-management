import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getBoardsQueryKey } from '@/modules/boards/hooks';
import { useAuthStore } from '@/store';
import { NotificationsService } from '../services';

const extractErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null) {
        const maybeError = error as {
            response?: { data?: { message?: string } };
            message?: string;
        };

        return maybeError.response?.data?.message || maybeError.message || fallback;
    }

    return fallback;
};

export const getNotificationsQueryKey = (userId: string | undefined) =>
    ['notifications', userId ?? 'anonymous'] as const;

export const useNotifications = (enabled = true) => {
    const userId = useAuthStore((state) => state.user?.id);

    return useQuery({
        queryKey: getNotificationsQueryKey(userId),
        queryFn: NotificationsService.list,
        enabled: Boolean(userId && enabled),
        refetchInterval: 20_000,
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);

    return useMutation({
        mutationFn: (notificationId: string) => NotificationsService.markRead(notificationId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey(userId) });
        },
    });
};

export const useAcceptInvite = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);

    return useMutation({
        mutationFn: (inviteId: string) => NotificationsService.acceptInvite(inviteId),
        onSuccess: async () => {
            toast.success('Invite accepted');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey(userId) }),
                queryClient.invalidateQueries({ queryKey: getBoardsQueryKey(userId) }),
            ]);
        },
        onError: (error: unknown) => {
            toast.error(extractErrorMessage(error, 'Unable to accept invite'));
        },
    });
};

export const useDeclineInvite = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);

    return useMutation({
        mutationFn: (inviteId: string) => NotificationsService.declineInvite(inviteId),
        onSuccess: async () => {
            toast.success('Invite declined');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey(userId) }),
                queryClient.invalidateQueries({ queryKey: getBoardsQueryKey(userId) }),
            ]);
        },
        onError: (error: unknown) => {
            toast.error(extractErrorMessage(error, 'Unable to decline invite'));
        },
    });
};

