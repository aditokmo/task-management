import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store';
import { BoardsService } from '../services';
import type { Board, BoardMembersResponse } from '../types/board.types';

interface CreateBoardInput {
    name: string;
    memberEmails?: string[];
}

interface ApiErrorLike {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}

const extractErrorMessage = (error: unknown, fallback: string) => {
    const candidate = error as ApiErrorLike;
    return candidate.response?.data?.message || candidate.message || fallback;
};

export const getBoardsQueryKey = (userId: string | undefined) => ['boards', userId ?? 'anonymous'] as const;
export const getBoardQueryKey = (userId: string | undefined, boardId: string) => ['board', userId ?? 'anonymous', boardId] as const;
export const getBoardMembersQueryKey = (userId: string | undefined, boardId: string) =>
    ['board-members', userId ?? 'anonymous', boardId] as const;

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

export const useBoardMembers = (boardId: string, enabled = true) => {
    const userId = useAuthStore((state) => state.user?.id);

    return useQuery({
        queryKey: getBoardMembersQueryKey(userId, boardId),
        queryFn: () => BoardsService.listMembers(boardId),
        enabled: Boolean(userId && boardId && enabled),
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
        onError: (error: unknown) => {
            const message = extractErrorMessage(error, 'Unable to create board');
            toast.error(message);
            console.error('Board creation error:', {
                data: (error as ApiErrorLike)?.response?.data,
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
        onError: (error: unknown) => {
            const message = extractErrorMessage(error, 'Unable to update board');
            toast.error(message);
        },
    });
};

interface AddBoardMembersInput {
    boardId: string;
    memberEmails: string[];
}

export const useAddBoardMembers = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);
    const boardsQueryKey = getBoardsQueryKey(userId);

    return useMutation({
        mutationFn: ({ boardId, memberEmails }: AddBoardMembersInput) =>
            BoardsService.addMembers(boardId, { memberEmails }),
        onSuccess: async (members: BoardMembersResponse) => {
            toast.success('Members added successfully');
            await queryClient.invalidateQueries({ queryKey: boardsQueryKey });
            queryClient.setQueryData(getBoardMembersQueryKey(userId, members.boardId), members);
        },
        onError: (error: unknown) => {
            const message = extractErrorMessage(error, 'Unable to add members');
            toast.error(message);
        },
    });
};

interface RemoveBoardMemberInput {
    boardId: string;
    memberUserId: string;
}

export const useRemoveBoardMember = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);
    const boardsQueryKey = getBoardsQueryKey(userId);

    return useMutation({
        mutationFn: ({ boardId, memberUserId }: RemoveBoardMemberInput) =>
            BoardsService.removeMember(boardId, memberUserId),
        onSuccess: async (_, variables) => {
            toast.success('Member removed from board');
            await queryClient.invalidateQueries({ queryKey: boardsQueryKey });
            await queryClient.invalidateQueries({
                queryKey: getBoardMembersQueryKey(userId, variables.boardId),
            });
        },
        onError: (error: unknown) => {
            const message = extractErrorMessage(error, 'Unable to remove member');
            toast.error(message);
        },
    });
};

export const useDeleteBoard = () => {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.user?.id);
    const boardsQueryKey = getBoardsQueryKey(userId);

    return useMutation({
        mutationFn: (boardId: string) => BoardsService.delete(boardId),
        onSuccess: async () => {
            toast.success('Board deleted successfully');
            await queryClient.invalidateQueries({ queryKey: boardsQueryKey });
        },
        onError: (error: unknown) => {
            const message = extractErrorMessage(error, 'Unable to delete board');
            toast.error(message);
        },
    });
};
