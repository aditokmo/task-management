import { Link, createFileRoute } from '@tanstack/react-router';
import { useBoard } from '@/modules/boards/hooks';
import { KanbanDashboard } from '@/modules/tasks/pages';
import { useAuthStore } from '@/store';

export const Route = createFileRoute('/_protected/boards/$boardId')({
    component: BoardDashboardPage,
});

function BoardDashboardPage() {
    const { boardId } = Route.useParams();
    const { data: board, isLoading, isError } = useBoard(boardId);
    const currentUserId = useAuthStore((state) => state.user?.id);

    if (isLoading) {
        return (
            <main className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="mx-auto w-full max-w-7xl rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                    Loading board...
                </div>
            </main>
        );
    }

    if (isError || !board) {
        return (
            <main className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="mx-auto w-full max-w-7xl rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                    Board does not exist. <Link to="/boards" className="font-medium text-foreground">Go back to boards</Link>.
                </div>
            </main>
        );
    }

    return (
        <KanbanDashboard
            boardId={boardId}
            boardName={board.name}
            canManageMembers={board.ownerId === currentUserId}
        />
    );
}
