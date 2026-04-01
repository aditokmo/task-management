import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BoardsService } from '../services';
import type { Board } from '../types/board.types';

interface CreateBoardInput {
    name: string;
    memberEmails?: string[];
}

export const BOARDS_QUERY_KEY = ['boards'] as const;

export const useBoards = () => {
    return useQuery({
        queryKey: BOARDS_QUERY_KEY,
        queryFn: BoardsService.list,
        staleTime: 30 * 1000,
    });
};

export const useBoard = (boardId: string) => {
    return useQuery({
        queryKey: ['board', boardId],
        queryFn: () => BoardsService.getById(boardId),
        enabled: Boolean(boardId),
    });
};

export const useOpenBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateBoardInput) => BoardsService.open(payload),
        onSuccess: async (board) => {
            toast.success(`Board "${board.name}" created successfully`);
            await queryClient.invalidateQueries({ queryKey: BOARDS_QUERY_KEY });
            queryClient.setQueryData<Board>(['board', board.id], board);
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
