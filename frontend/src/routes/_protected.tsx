import { createFileRoute, redirect } from '@tanstack/react-router';
import { MainLayout } from '@/layout';
import { useAuthStore } from '@/store';

export const Route = createFileRoute('/_protected')({
    beforeLoad: ({ location }) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;

        if (!isAuthenticated) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    component: () => <MainLayout />,
});