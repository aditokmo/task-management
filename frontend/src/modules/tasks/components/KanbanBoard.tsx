import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext } from '@hello-pangea/dnd';
import gsap from 'gsap';
import { useTaskUIStore } from '@/store';
import { useMoveTask, useTaskSocketSync, useTasks } from '../hooks';
import { TASK_STATUS, type Task, type TaskStatus } from '../types';
import { KanbanColumn } from './KanbanColumn';

interface ColumnConfig {
    status: TaskStatus;
    title: string;
}

const COLUMNS: ColumnConfig[] = [
    { status: TASK_STATUS.BACKLOG, title: 'Backlog' },
    { status: TASK_STATUS.TODO, title: 'Todo' },
    { status: TASK_STATUS.IN_PROGRESS, title: 'In-Progress' },
    { status: TASK_STATUS.DONE, title: 'Done' },
];

const sortByPosition = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => a.position - b.position);
};

export function KanbanBoard() {
    const { data: tasks = [], isLoading } = useTasks();
    const moveTask = useMoveTask();
    const openTaskDetail = useTaskUIStore((state) => state.openTaskDetail);
    const boardRef = useRef<HTMLDivElement | null>(null);

    useTaskSocketSync();

    useLayoutEffect(() => {
        if (!boardRef.current) {
            return;
        }

        const context = gsap.context(() => {
            gsap.from('.task-card', {
                opacity: 0,
                y: 12,
                duration: 0.35,
                stagger: 0.05,
                ease: 'power2.out',
            });
        }, boardRef);

        return () => {
            context.revert();
        };
    }, [tasks.length]);

    const groupedTasks = useMemo(() => {
        return COLUMNS.reduce<Record<TaskStatus, Task[]>>((accumulator, column) => {
            accumulator[column.status] = sortByPosition(tasks.filter((task) => task.status === column.status));
            return accumulator;
        }, {
            [TASK_STATUS.BACKLOG]: [],
            [TASK_STATUS.TODO]: [],
            [TASK_STATUS.IN_PROGRESS]: [],
            [TASK_STATUS.DONE]: [],
        });
    }, [tasks]);

    const onDragEnd = useCallback(
        (result: DropResult) => {
            if (!result.destination) {
                return;
            }

            const source = result.source;
            const destination = result.destination;

            if (source.droppableId === destination.droppableId && source.index === destination.index) {
                return;
            }

            moveTask.mutate({
                taskId: result.draggableId,
                status: destination.droppableId as TaskStatus,
                position: destination.index,
            });
        },
        [moveTask],
    );

    if (isLoading) {
        return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Loading tasks...</div>;
    }

    return (
        <div ref={boardRef}>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                    {COLUMNS.map((column) => (
                        <KanbanColumn
                            key={column.status}
                            status={column.status}
                            title={column.title}
                            tasks={groupedTasks[column.status]}
                            onTaskClick={openTaskDetail}
                        />
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
