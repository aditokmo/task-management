import { ApiService } from '@/api';
import type {
    AddBoardMembersPayload,
    Board,
    BoardMembersResponse,
    BoardResponse,
    CreateBoardPayload,
    ListBoardsResponse,
    OpenBoardPayload,
    UpdateBoardPayload,
} from '../types/board.types';
import { ENDPOINTS } from './endpoint';

const normalizeBoardList = (response: Board[] | ListBoardsResponse): Board[] => {
    return Array.isArray(response) ? response : response.data;
};

const normalizeBoard = (response: Board | BoardResponse): Board => {
    return 'data' in response ? response.data : response;
};

export const BoardsService = {
    list: async (): Promise<Board[]> => {
        const response = await ApiService.get<Board[] | ListBoardsResponse>(ENDPOINTS.BOARDS.LIST);
        return normalizeBoardList(response);
    },

    getById: async (boardId: string): Promise<Board> => {
        const response = await ApiService.get<Board | BoardResponse>(ENDPOINTS.BOARDS.BY_ID(boardId));
        return normalizeBoard(response);
    },

    create: async (payload: CreateBoardPayload): Promise<Board> => {
        const response = await ApiService.post<CreateBoardPayload, Board | BoardResponse>(
            ENDPOINTS.BOARDS.CREATE,
            payload,
        );
        return normalizeBoard(response);
    },

    open: async (payload: OpenBoardPayload): Promise<Board> => {
        const response = await ApiService.post<OpenBoardPayload, Board | BoardResponse>(
            ENDPOINTS.BOARDS.OPEN,
            payload,
        );
        return normalizeBoard(response);
    },

    update: async (boardId: string, payload: UpdateBoardPayload): Promise<Board> => {
        const response = await ApiService.patch<UpdateBoardPayload, Board | BoardResponse>(
            ENDPOINTS.BOARDS.UPDATE(boardId),
            payload,
        );
        return normalizeBoard(response);
    },

    delete: async (boardId: string): Promise<void> => {
        await ApiService.delete<void>(ENDPOINTS.BOARDS.DELETE(boardId));
    },

    listMembers: async (boardId: string): Promise<BoardMembersResponse> => {
        return ApiService.get<BoardMembersResponse>(ENDPOINTS.BOARDS.MEMBERS(boardId));
    },

    addMembers: async (boardId: string, payload: AddBoardMembersPayload): Promise<BoardMembersResponse> => {
        return ApiService.post<AddBoardMembersPayload, BoardMembersResponse>(
            ENDPOINTS.BOARDS.MEMBERS(boardId),
            payload,
        );
    },

    removeMember: async (boardId: string, memberUserId: string): Promise<void> => {
        await ApiService.delete<void>(ENDPOINTS.BOARDS.REMOVE_MEMBER(boardId, memberUserId));
    },

    acceptInvite: async (inviteId: string): Promise<{ success: boolean }> => {
        return ApiService.post<undefined, { success: boolean }>(
            ENDPOINTS.BOARDS.ACCEPT_INVITE(inviteId),
        );
    },

    declineInvite: async (inviteId: string): Promise<{ success: boolean }> => {
        return ApiService.post<undefined, { success: boolean }>(
            ENDPOINTS.BOARDS.DECLINE_INVITE(inviteId),
        );
    },
};
