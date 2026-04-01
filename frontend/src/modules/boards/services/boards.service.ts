import { ApiService } from '@/api';
import type {
    Board,
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
};
