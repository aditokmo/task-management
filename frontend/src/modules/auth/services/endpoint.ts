export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        FORGOT_PASSWORD: '/auth/forgot-password',
        GOOGLE: '/auth/google',
        PROFILE: '/auth/profile',
        CHANGE_PASSWORD: '/auth/change-password',
    },
} as const;

export type EndpointType = typeof ENDPOINTS;