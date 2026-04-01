import { Link } from '@tanstack/react-router';
import { ChevronLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskUIStore } from '@/store';
import { KanbanBoard, NewTaskDialog, TaskDetailSheet } from '../components';

interface KanbanDashboardProps {
    boardId: string;
    boardName: string;
}

export function KanbanDashboard({ boardId, boardName }: KanbanDashboardProps) {
    const openCreateDialog = useTaskUIStore((state) => state.openCreateDialog);

    return (
        <main className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
                <header className="flex flex-col gap-3 rounded-xl border bg-card/90 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            to="/boards"
                            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                        >
                            <ChevronLeft className="size-3.5" />
                            Back to boards
                        </Link>
                        <h1 className="text-xl font-semibold tracking-tight">{boardName}</h1>
                        <p className="text-sm text-muted-foreground">
                            Drag tasks across board columns to track progress in real-time.
                        </p>
                    </div>

                    <Button onClick={openCreateDialog}>
                        <Plus />
                        New Task
                    </Button>
                </header>

                <KanbanBoard boardId={boardId} />
            </div>

            <NewTaskDialog boardId={boardId} />
            <TaskDetailSheet boardId={boardId} />
        </main>
    );
}
