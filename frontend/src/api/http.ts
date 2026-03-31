import axios, { type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store';

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    headers: { "Content-Type": "application/json" },
    withCredentials: true
});

let isRefreshing = false;
let failedQueue: ((token: string) => void)[] = [];

const processQueue = (token: string) => {
    failedQueue.forEach(callback => callback(token));
    failedQueue = [];
};

http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = useAuthStore.getState().accessToken;

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    }
)

http.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const status = error.response?.status;

        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    // Attempt to refresh token
                    const response = await axios.post(
                        `${http.defaults.baseURL}/auth/refresh`,
                        {},
                        { withCredentials: true }
                    );

                    const { accessToken } = response.data;
                    const { setAccessToken } = useAuthStore.getState();
                    setAccessToken(accessToken);

                    processQueue(accessToken);

                    // Retry original request with new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    }
                    return http(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear auth and redirect to login
                    const { clearAuth } = useAuthStore.getState();
                    clearAuth();
                    failedQueue = [];
                    window.location.replace('/login');
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                // Queue request if already refreshing
                return new Promise((resolve) => {
                    failedQueue.push((token: string) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(http(originalRequest));
                    });
                });
            }
        }

        const onAuthPage =
            window.location.pathname === '/login' ||
            window.location.pathname === '/register' ||
            window.location.pathname === '/forgot-password';

        if (status === 401 && !onAuthPage) {
            const { clearAuth } = useAuthStore.getState();
            clearAuth();
            window.location.replace('/login');
        }

        if (status === 500) console.error("Server Error: ", error.response?.data as { message?: string } || "Internal Server Error")

        return Promise.reject(error);
    }
)