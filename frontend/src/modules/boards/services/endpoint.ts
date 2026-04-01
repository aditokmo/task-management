export const ENDPOINTS = {
    BOARDS: {
        LIST: '/boards',
        CREATE: '/boards',
        OPEN: '/boards/open',
        BY_ID: (boardId: string) => `/boards/${boardId}`,
    },
} as const;
