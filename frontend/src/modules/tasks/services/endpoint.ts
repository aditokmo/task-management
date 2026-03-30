export const ENDPOINTS = {
    TASKS: {
        LIST: '/tasks',
        CREATE: '/tasks',
        BY_ID: (taskId: string) => `/tasks/${taskId}`,
        MOVE: (taskId: string) => `/tasks/${taskId}/move`,
    },
} as const;
