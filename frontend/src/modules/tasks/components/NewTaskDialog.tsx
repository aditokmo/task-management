import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { useCreateTask } from '../hooks';
import { TASK_PRIORITY, TASK_STATUS, type TaskPriority, type TaskStatus } from '../types';

const createTaskSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    description: z.string().max(1000, 'Description is too long').optional(),
    priority: z.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]),
    status: z.enum([TASK_STATUS.BACKLOG, TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]),
    dueDate: z.string().min(1, 'Due date is required'),
    assigneeName: z.string().max(120, 'Assignee name is too long').optional(),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

const DEFAULT_VALUES: CreateTaskFormValues = {
    title: '',
    description: '',
    priority: TASK_PRIORITY.MEDIUM,
    status: TASK_STATUS.BACKLOG,
    dueDate: '',
    assigneeName: '',
};

const toISOString = (dateValue: string) => {
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
    { value: TASK_PRIORITY.LOW, label: 'Low' },
    { value: TASK_PRIORITY.MEDIUM, label: 'Medium' },
    { value: TASK_PRIORITY.HIGH, label: 'High' },
];

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
    { value: TASK_STATUS.BACKLOG, label: 'Backlog' },
    { value: TASK_STATUS.TODO, label: 'Todo' },
    { value: TASK_STATUS.IN_PROGRESS, label: 'In-Progress' },
    { value: TASK_STATUS.DONE, label: 'Done' },
];

export function NewTaskDialog() {
    const isOpen = useTaskUIStore((state) => state.isCreateDialogOpen);
    const closeDialog = useTaskUIStore((state) => state.closeCreateDialog);
    const createTask = useCreateTask();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateTaskFormValues>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const onSubmit = handleSubmit(async (values) => {
        const payload = {
            title: values.title,
            ...(values.description ? { description: values.description } : {}),
            priority: values.priority,
            status: values.status,
            dueDate: toISOString(values.dueDate),
            ...(values.assigneeName ? { assigneeName: values.assigneeName } : {}),
        };
        await createTask.mutateAsync(payload);

        reset(DEFAULT_VALUES);
        closeDialog();
    });

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    closeDialog();
                    reset(DEFAULT_VALUES);
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
