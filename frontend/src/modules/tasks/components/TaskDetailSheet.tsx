import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useTaskUIStore } from '@/store';
import { priorityOptions } from '../constants';
import { useTasks, useUpdateTask } from '../hooks';
import { TASK_PRIORITY, type TaskPriority } from '../types';
import { formatDateForInput } from '../utils';

export function TaskDetailSheet() {
    const isTaskDetailOpen = useTaskUIStore((state) => state.isTaskDetailOpen);
    const selectedTaskId = useTaskUIStore((state) => state.selectedTaskId);
    const closeTaskDetail = useTaskUIStore((state) => state.closeTaskDetail);

    const { data: tasks = [] } = useTasks();
    const updateTask = useUpdateTask();
    const panelRef = useRef<HTMLDivElement | null>(null);

    const selectedTask = useMemo(() => {
        return tasks.find((task) => task.id === selectedTaskId) ?? null;
    }, [tasks, selectedTaskId]);

    const [description, setDescription] = useState('');
    const [assigneeName, setAssigneeName] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TASK_PRIORITY.MEDIUM);
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (!selectedTask) {
            setDescription('');
            setAssigneeName('');
            setPriority(TASK_PRIORITY.MEDIUM);
            setDueDate('');
            return;
        }

        setDescription(selectedTask.description ?? '');
        setAssigneeName(selectedTask.assigneeName ?? '');
        setPriority(selectedTask.priority);
        setDueDate(formatDateForInput(selectedTask.dueDate));
    }, [selectedTask]);

    useLayoutEffect(() => {
        if (!isTaskDetailOpen || !panelRef.current) {
            return;
        }

        const tween = gsap.fromTo(
            panelRef.current,
            { x: 80, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
        );

        return () => {
            tween.kill();
        };
    }, [isTaskDetailOpen, selectedTaskId]);

    const onSave = async () => {
        if (!selectedTask) {
            return;
        }

        await updateTask.mutateAsync({
            taskId: selectedTask.id,
            payload: {
                description,
                assigneeName,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : selectedTask.dueDate,
            },
        });
    };

    return (
        <Sheet open={isTaskDetailOpen} onOpenChange={(open) => !open && closeTaskDetail()}>
            <SheetContent side="right" className="w-full sm:max-w-xl" ref={panelRef}>
                <SheetHeader>
                    <SheetTitle>{selectedTask?.title ?? 'Task Details'}</SheetTitle>
                    <SheetDescription>Update details and assignee information.</SheetDescription>
                </SheetHeader>

                {selectedTask ? (
                    <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Description</label>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                className="min-h-32 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Assignee</label>
                            <Input value={assigneeName} onChange={(event) => setAssigneeName(event.target.value)} />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(event) => setPriority(event.target.value as TaskPriority)}
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
                                <label className="text-xs font-medium text-muted-foreground">Due date</label>
                                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-4 text-sm text-muted-foreground">Select a task card to edit details.</div>
                )}

                <SheetFooter>
                    <Button variant="outline" onClick={closeTaskDetail}>
                        Close
                    </Button>
                    <Button onClick={onSave} disabled={!selectedTask || updateTask.isPending}>
                        {updateTask.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
