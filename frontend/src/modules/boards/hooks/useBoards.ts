import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';
import { BoardsService } from '../services';
import type { Board } from '../types/board.types';

interface CreateBoardInput {
    name: string;
    memberEmails?: string[];
}

export const getBoardsQueryKey = (userId: string | undefined) => ['boards', userId ?? 'anonymous'] as const;
export const getBoardQueryKey = (userId: string | undefined, boardId: string) => ['board', userId ?? 'anonymous', boardId] as const;

export const useBoards = () => {
    const userId = useAuthStore((state) => state.user?.id);

    return useQuery({
        queryKey: getBoardsQueryKey(userId),
        queryFn: BoardsService.list,
        staleTime: 30 * 1000,
        enabled: Boolean(userId),
    });
};

export const useBoard = (boardId: string) => {
    const userId = useAuthStore((state) => state.user?.id);

    return useQuery({
        queryKey: getBoardQueryKey(userId, boardId),
        queryFn: () => BoardsService.getById(boardId),
        enabled: Boolean(userId && boardId),
    });
};

export const useOpenBoard = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);
    const boardsQueryKey = getBoardsQueryKey(userId);

    return useMutation({
        mutationFn: (payload: CreateBoardInput) => BoardsService.open(payload),
        onSuccess: async (board) => {
            toast.success(`Board "${board.name}" created successfully`);
            await queryClient.invalidateQueries({ queryKey: boardsQueryKey });
            queryClient.setQueryData<Board>(getBoardQueryKey(userId, board.id), board);
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Unable to create board';
            toast.error(message);
            console.error('Board creation error:', {
                status: error?.response?.status,
                data: error?.response?.data,
                message: message,
                fullError: error,
            });
        },
    });
};

interface UpdateBoardInput {
    boardId: string;
    name: string;
    memberEmails?: string[];
}

export const useUpdateBoard = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);
    const boardsQueryKey = getBoardsQueryKey(userId);

    return useMutation({
        mutationFn: ({ boardId, name, memberEmails }: UpdateBoardInput) => {
            const payload: import('../types/board.types').UpdateBoardPayload = { name };
            if (memberEmails !== undefined) {
                payload.memberEmails = memberEmails;
            }
            return BoardsService.update(boardId, payload);
        },
        onSuccess: async (board) => {
            toast.success(`Board "${board.name}" updated successfully`);
            await queryClient.invalidateQueries({ queryKey: boardsQueryKey });
            queryClient.setQueryData<Board>(getBoardQueryKey(userId, board.id), board);
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Unable to update board';
            toast.error(message);
        },
    });
};
