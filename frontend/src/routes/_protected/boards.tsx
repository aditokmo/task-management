import { createFileRoute } from '@tanstack/react-router';
import { BoardsPage } from '@/modules/boards/pages';

export const Route = createFileRoute('/_protected/boards')({
    component: () => <BoardsPage />,
});
