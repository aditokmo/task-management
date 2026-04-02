export const ENDPOINTS = {
    BOARDS: {
        LIST: '/boards',
        CREATE: '/boards',
        OPEN: '/boards/open',
        BY_ID: (boardId: string) => `/boards/${boardId}`,
        UPDATE: (boardId: string) => `/boards/${boardId}`,
        DELETE: (boardId: string) => `/boards/${boardId}`,
        MEMBERS: (boardId: string) => `/boards/${boardId}/members`,
        REMOVE_MEMBER: (boardId: string, memberUserId: string) => `/boards/${boardId}/members/${memberUserId}`,
    },
} as const;
