import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { z } from 'zod';
import { useAuthStore } from '@/store';

const searchSchema = z.object({
    accessToken: z.string(),
    userId: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
});

export const Route = createFileRoute('/oauth/callback')({
    validateSearch: searchSchema,
    component: OAuthCallback,
});

function OAuthCallback() {
    const { accessToken, userId, email, name } = Route.useSearch();
    const setAuth = useAuthStore((s) => s.setAuth);
    const navigate = useNavigate();

    useEffect(() => {
        setAuth({ id: userId, email, name }, accessToken);
        navigate({ to: '/boards', replace: true });
    }, [accessToken, userId, email, name, setAuth, navigate]);

    return null;
}
