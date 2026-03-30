import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthUser } from '@/modules/auth/types';

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    token: string | null;
    setAuth: (user: AuthUser) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            token: null,

            setAuth: (user) => set({
                user,
                isAuthenticated: true,
                token: user.token,
            }),

            clearAuth: () => set({
                user: null,
                isAuthenticated: false,
                token: null,
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