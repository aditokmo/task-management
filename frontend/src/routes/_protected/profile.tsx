import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage } from '@/modules/auth/pages';

export const Route = createFileRoute('/_protected/profile')({
    component: () => <ProfilePage />,
});
