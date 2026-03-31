import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthUser } from '@/modules/auth/types';

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    accessToken: string | null;
    setAuth: (user: AuthUser, accessToken: string) => void;
    setAccessToken: (accessToken: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            accessToken: null,

            setAuth: (user, accessToken) => set({
                user,
                isAuthenticated: true,
                accessToken,
            }),

            setAccessToken: (accessToken) => set({
                accessToken,
            }),

            clearAuth: () => set({
                user: null,
                isAuthenticated: false,
                accessToken: null,
            }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);