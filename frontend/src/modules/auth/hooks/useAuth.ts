import { getAPIErrorMessage } from "@/utils/api-error-handler";
import { AuthService } from "../services"
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store';

export const useAuth = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setAuth = useAuthStore((state) => state.setAuth);
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    const toAuthUser = (user: { id: string; email: string; name?: string }) => ({
        id: user.id,
        email: user.email,
        ...(user.name ? { name: user.name } : {}),
    });

    const login = useMutation({
        mutationFn: AuthService.login,
        onSuccess: async (res) => {
            queryClient.clear();

            if (res.user && res.accessToken) {
                setAuth(toAuthUser(res.user), res.accessToken);
            }

            await navigate({ to: '/boards' });
        },
        onError: (error) => {
            const errorMessage = getAPIErrorMessage(error);
            console.error(errorMessage)
        },
    });

    const register = useMutation({
        mutationFn: AuthService.register,
        onSuccess: async (res) => {
            queryClient.clear();

            if (res.user && res.accessToken) {
                setAuth(toAuthUser(res.user), res.accessToken);
            }

            await navigate({ to: '/boards' });
        },
        onError: (error) => {
            const errorMessage = getAPIErrorMessage(error);
            console.error(errorMessage)
        },
    });

    const refresh = useMutation({
        mutationFn: AuthService.refresh,
        onSuccess: async (res) => {
            if (res.accessToken) {
                setAccessToken(res.accessToken);
            }
        },
        onError: (error) => {
            clearAuth();
            queryClient.clear();
            const errorMessage = getAPIErrorMessage(error);
            console.error(errorMessage)
        },
    });

    const logout = useMutation({
        mutationFn: AuthService.logout,
        onSuccess: async () => {
            clearAuth();
            queryClient.clear();
            await navigate({ to: '/login' });
        },
        onError: (error) => {
            const errorMessage = getAPIErrorMessage(error);
            console.error(errorMessage)
        },
    });

    const loginErrorMessage = login.error ? getAPIErrorMessage(login.error) : null;
    const registerErrorMessage = register.error ? getAPIErrorMessage(register.error) : null;
    const refreshErrorMessage = refresh.error ? getAPIErrorMessage(refresh.error) : null;
    const logoutErrorMessage = logout.error ? getAPIErrorMessage(logout.error) : null;

    return {
        login,
        register,
        refresh,
        logout,
        loginErrorMessage,
        registerErrorMessage,
        refreshErrorMessage,
        logoutErrorMessage,
    }
}