export const ENDPOINTS = {
    NOTIFICATIONS: {
        LIST: '/notifications',
        MARK_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
    },
} as const;
