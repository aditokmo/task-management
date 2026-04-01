import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTaskUIStore } from '@/store';
import {
    CREATE_TASK_DEFAULT_VALUES,
    priorityOptions,
    statusOptions,
} from '../constants';
import { useCreateTask } from '../hooks';
import { createTaskSchema, type CreateTaskFormValues } from '../schemas';
import { toISOStringSafe } from '../utils';

interface NewTaskDialogProps {
    boardId: string;
}

export function NewTaskDialog({ boardId }: NewTaskDialogProps) {
    const isOpen = useTaskUIStore((state) => state.isCreateDialogOpen);
    const closeDialog = useTaskUIStore((state) => state.closeCreateDialog);
    const createTask = useCreateTask(boardId);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateTaskFormValues>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: CREATE_TASK_DEFAULT_VALUES,
    });

    const onSubmit = handleSubmit(async (values) => {
        const payload = {
            title: values.title,
            ...(values.description ? { description: values.description } : {}),
            priority: values.priority,
            status: values.status,
            dueDate: toISOStringSafe(values.dueDate),
            ...(values.assigneeName ? { assigneeName: values.assigneeName } : {}),
        };
        await createTask.mutateAsync(payload);

        reset(CREATE_TASK_DEFAULT_VALUES);
        closeDialog();
    });

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    closeDialog();
                    reset(CREATE_TASK_DEFAULT_VALUES);
                }
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                    <DialogDescription>Add a task to your board.</DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Title</label>
                        <Input {...register('title')} placeholder="Design onboarding flow" />
                        {errors.title?.message && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <textarea
                            {...register('description')}
                            placeholder="Optional details"
                            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                        {errors.description?.message && (
                            <p className="text-xs text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Priority</label>
                            <select
                                {...register('priority')}
                                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                {priorityOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            <select
                                {...register('status')}
                                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Due date</label>
                            <Input type="date" {...register('dueDate')} />
                            {errors.dueDate?.message && (
                                <p className="text-xs text-destructive">{errors.dueDate.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Assignee</label>
                            <Input {...register('assigneeName')} placeholder="Jane Doe" />
                            {errors.assigneeName?.message && (
                                <p className="text-xs text-destructive">{errors.assigneeName.message}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={createTask.isPending}>
                            {createTask.isPending ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
