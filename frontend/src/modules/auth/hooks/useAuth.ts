import { getAPIErrorMessage } from "@/utils/api-error-handler";
import { AuthService } from "../services"
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store';

export const useAuth = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    const login = useMutation({
        mutationFn: AuthService.login,
        onSuccess: async (res) => {
            console.log(res)
            if (res.user) {
                setAuth({
                    id: res.user.id,
                    email: res.user.email,
                    name: res.user.name,
                    token: res.token,
                });
            }

            await navigate({ to: '/' });

            console.log(12321)
        },
        onError: (error) => {
            const errorMessage = getAPIErrorMessage(error);
            console.error(errorMessage)
        },
    });

    const register = useMutation({
        mutationFn: AuthService.register,
        onSuccess: async (res) => {
            if (res.user) {
                setAuth({
                    id: res.user.id,
                    email: res.user.email,
                    name: res.user.name,
                });
            }

            await navigate({ to: '/' });
        },
        onError: (error) => {
            const errorMessage = getAPIErrorMessage(error);
            console.error(errorMessage)
        },
    });

    const logout = useMutation({
        mutationFn: AuthService.logout,
        onSuccess: async () => {
            clearAuth();
            await navigate({ to: '/login' });
        },
        onError: (error) => {
            const errorMessage = getAPIErrorMessage(error);
            console.error(errorMessage)
        },
    });

    const loginErrorMessage = login.error ? getAPIErrorMessage(login.error) : null;
    const registerErrorMessage = register.error ? getAPIErrorMessage(register.error) : null;
    const logoutErrorMessage = logout.error ? getAPIErrorMessage(logout.error) : null;

    return {
        login,
        register,
        logout,
        loginErrorMessage,
        registerErrorMessage,
        logoutErrorMessage,
    }
}