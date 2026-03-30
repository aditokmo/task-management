import axios, { type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store';

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    headers: { "Content-Type": "application/json" },
    withCredentials: true
});

http.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (typeof window !== 'undefined' && 'cookieStore' in window) {
            const token = await window.cookieStore.get("token");
            if (token) config.headers.Authorization = `Bearer ${token.value}`;
        }

        return config;
    }
)

http.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        const status = error.response?.status;

        if (status === 401) {
            const { clearAuth } = useAuthStore.getState();
            clearAuth();

            const onAuthPage =
                window.location.pathname === '/login' ||
                window.location.pathname === '/register' ||
                window.location.pathname === '/forgot-password';

            if (!onAuthPage) {
                window.location.replace('/login');
            }
        }
        if (status === 500) console.error("Server Error: ", error.response?.data as { message?: string } || "Internal Server Error")

        return Promise.reject(error);
    }
)