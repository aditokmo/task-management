export interface Board {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface OpenBoardPayload {
    name: string;
    memberEmails?: string[];
}

export interface CreateBoardPayload {
    name: string;
    memberEmails?: string[];
}

export interface UpdateBoardPayload {
    name?: string;
    memberEmails?: string[];
}

export interface BoardMember {
    id: string;
    email: string;
    name: string | null;
    role: 'owner' | 'member';
}

export interface BoardMembersResponse {
    boardId: string;
    members: BoardMember[];
}

export interface AddBoardMembersPayload {
    memberEmails: string[];
}

export interface BoardResponse {
    data: Board;
}

export interface ListBoardsResponse {
    data: Board[];
}
