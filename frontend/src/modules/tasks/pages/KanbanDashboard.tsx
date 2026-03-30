import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskUIStore } from '@/store';
import { KanbanBoard, NewTaskDialog, TaskDetailSheet } from '../components';

export function KanbanDashboard() {
    const openCreateDialog = useTaskUIStore((state) => state.openCreateDialog);

    return (
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 sm:p-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
                <header className="flex flex-col gap-3 rounded-xl border bg-card/90 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Task Management Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Drag tasks across board columns to track progress in real-time.
                        </p>
                    </div>

                    <Button onClick={openCreateDialog}>
                        <Plus />
                        New Task
                    </Button>
                </header>

                <KanbanBoard />
            </div>

            <NewTaskDialog />
            <TaskDetailSheet />
        </main>
    );
}
