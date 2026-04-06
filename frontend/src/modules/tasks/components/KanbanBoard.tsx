import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext } from '@hello-pangea/dnd';
import gsap from 'gsap';
import type { BoardMember } from '@/modules/boards/types/board.types';
import { useTaskUIStore } from '@/store';
import { KANBAN_COLUMNS } from '../constants';
import { useMoveTask, useTaskSocketSync, useTasks } from '../hooks';
import { TASK_STATUS, type Task, type TaskStatus } from '../types';
import { sortTasksByPosition } from '../utils';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
    boardId: string;
    selectedAssigneeIds: string[];
    members: BoardMember[];
}

export function KanbanBoard({ boardId, selectedAssigneeIds, members }: KanbanBoardProps) {
    const { data: tasks = [], isLoading } = useTasks(boardId);
    const moveTask = useMoveTask(boardId);
    const openCreateDialog = useTaskUIStore((state) => state.openCreateDialog);
    const openTaskDetail = useTaskUIStore((state) => state.openTaskDetail);
    const boardRef = useRef<HTMLDivElement | null>(null);

    useTaskSocketSync(boardId);

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
        const selectedMemberNames = new Set(
            members
                .filter((member) => selectedAssigneeIds.includes(member.id))
                .map((member) => member.name?.trim().toLowerCase())
                .filter((name): name is string => Boolean(name)),
        );
        const selectedAssigneeIdSet = new Set(selectedAssigneeIds);

        const filteredTasks = selectedAssigneeIds.length > 0
            ? tasks.filter((task) => {
                if (task.assigneeId && selectedAssigneeIdSet.has(task.assigneeId)) {
                    return true;
                }

                if (!task.assigneeName) {
                    return false;
                }

                return selectedMemberNames.has(task.assigneeName.trim().toLowerCase());
            })
            : tasks;

        return KANBAN_COLUMNS.reduce<Record<TaskStatus, Task[]>>((accumulator, column) => {
            accumulator[column.status] = sortTasksByPosition(filteredTasks.filter((task) => task.status === column.status));
            return accumulator;
        }, {
            [TASK_STATUS.BACKLOG]: [],
            [TASK_STATUS.TODO]: [],
            [TASK_STATUS.IN_PROGRESS]: [],
            [TASK_STATUS.DONE]: [],
        });
    }, [members, selectedAssigneeIds, tasks]);

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
                    {KANBAN_COLUMNS.map((column) => (
                        <KanbanColumn
                            key={column.status}
                            status={column.status}
                            title={column.title}
                            tasks={groupedTasks[column.status]}
                            onTaskClick={openTaskDetail}
                            onCreateTask={openCreateDialog}
                        />
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
