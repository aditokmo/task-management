import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { TaskService } from '../services';
import type { CreateTaskPayload, MoveTaskPayload, Task, TaskStatus, UpdateTaskPayload } from '../types';

export const getTasksQueryKey = (boardId: string) => ['tasks', boardId] as const;

interface MoveTaskInput extends MoveTaskPayload {
    taskId: string;
}

interface UpdateTaskInput {
    taskId: string;
    payload: UpdateTaskPayload;
}

const compareTasks = (a: Task, b: Task) => a.position - b.position;

const normalizeColumnPositions = (tasks: Task[], status: TaskStatus): Task[] => {
    const inColumn = tasks.filter((task) => task.status === status).sort(compareTasks);

    return tasks.map((task) => {
        if (task.status !== status) {
            return task;
        }

        const nextIndex = inColumn.findIndex((columnTask) => columnTask.id === task.id);
        return {
            ...task,
            position: nextIndex,
        };
    });
};

const optimisticMove = (tasks: Task[], input: MoveTaskInput): Task[] => {
    const taskToMove = tasks.find((task) => task.id === input.taskId);
    if (!taskToMove) {
        return tasks;
    }

    const sourceStatus = taskToMove.status;
    const destinationStatus = input.status;

    const sourceColumn = tasks
        .filter((task) => task.status === sourceStatus && task.id !== input.taskId)
        .sort(compareTasks);

    const destinationColumn = tasks
        .filter((task) => task.status === destinationStatus && task.id !== input.taskId)
        .sort(compareTasks);

    const movedTask: Task = {
        ...taskToMove,
        status: destinationStatus,
        position: Math.max(0, input.position),
        updatedAt: new Date().toISOString(),
    };

    const destinationInsertIndex = Math.min(Math.max(input.position, 0), destinationColumn.length);
    destinationColumn.splice(destinationInsertIndex, 0, movedTask);

    const nextTasks = tasks
        .filter((task) => task.id !== input.taskId)
        .map((task) => {
            if (task.status === sourceStatus) {
                const index = sourceColumn.findIndex((columnTask) => columnTask.id === task.id);
                return {
                    ...task,
                    position: index,
                };
            }

            if (task.status === destinationStatus) {
                const index = destinationColumn.findIndex((columnTask) => columnTask.id === task.id);
                return {
                    ...task,
                    position: index,
                };
            }

            return task;
        });

    nextTasks.push(movedTask);

    return nextTasks;
};

export const useTasks = (boardId: string) => {
    return useQuery({
        queryKey: getTasksQueryKey(boardId),
        queryFn: () => TaskService.list(boardId),
        staleTime: 10 * 1000,
        enabled: Boolean(boardId),
    });
};

export const useCreateTask = (boardId: string) => {
    const queryClient = useQueryClient();
    const queryKey = getTasksQueryKey(boardId);

    return useMutation({
        mutationFn: (payload: Omit<CreateTaskPayload, 'boardId'>) =>
            TaskService.create({ ...payload, boardId }),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<Task[]>(queryKey) ?? [];

            const nextPosition = previousTasks.filter((task) => task.status === payload.status).length;
            const optimisticTask: Task = {
                id: `temp-${Date.now()}`,
                title: payload.title,
                description: payload.description ?? '',
                priority: payload.priority,
                status: payload.status,
                dueDate: payload.dueDate,
                boardId,
                position: nextPosition,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...(payload.assigneeId ? { assigneeId: payload.assigneeId } : {}),
                ...(payload.assigneeName ? { assigneeName: payload.assigneeName } : {}),
            };

            queryClient.setQueryData<Task[]>(queryKey, [...previousTasks, optimisticTask]);

            return { previousTasks, optimisticTaskId: optimisticTask.id };
        },
        onError: (_error, _payload, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(queryKey, context.previousTasks);
            }
            toast.error('Failed to create task');
        },
        onSuccess: (createdTask, _payload, context) => {
            const currentTasks = queryClient.getQueryData<Task[]>(queryKey) ?? [];
            const withServerTask = currentTasks.map((task) => {
                if (task.id === context?.optimisticTaskId) {
                    return createdTask;
                }

                return task;
            });

            queryClient.setQueryData<Task[]>(queryKey, withServerTask);
            toast.success('Task created successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
};

export const useUpdateTask = (boardId: string) => {
    const queryClient = useQueryClient();
    const queryKey = getTasksQueryKey(boardId);

    return useMutation({
        mutationFn: ({ taskId, payload }: UpdateTaskInput) => TaskService.update(taskId, payload),
        onMutate: async ({ taskId, payload }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<Task[]>(queryKey) ?? [];

            const nextTasks = previousTasks.map((task) => {
                if (task.id !== taskId) {
                    return task;
                }

                return {
                    ...task,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                };
            });

            queryClient.setQueryData<Task[]>(queryKey, nextTasks);

            return { previousTasks };
        },
        onError: (_error, _payload, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(queryKey, context.previousTasks);
            }
            toast.error('Failed to update task');
        },
        onSuccess: (updatedTask) => {
            const currentTasks = queryClient.getQueryData<Task[]>(queryKey) ?? [];
            const mergedTasks = currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
            queryClient.setQueryData(queryKey, mergedTasks);
            toast.success('Task updated successfully');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
};

export const useMoveTask = (boardId: string) => {
    const queryClient = useQueryClient();
    const queryKey = getTasksQueryKey(boardId);

    return useMutation({
        mutationFn: ({ taskId, status, position }: MoveTaskInput) =>
            TaskService.move(taskId, { status, position }),
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTasks = queryClient.getQueryData<Task[]>(queryKey) ?? [];

            const optimisticTasks = optimisticMove(previousTasks, input);
            queryClient.setQueryData<Task[]>(queryKey, optimisticTasks);

            return { previousTasks };
        },
        onError: (_error, _input, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(queryKey, context.previousTasks);
            }
            toast.error('Failed to move task');
        },
        onSuccess: (serverTask) => {
            const currentTasks = queryClient.getQueryData<Task[]>(queryKey) ?? [];
            const mergedTasks = currentTasks.map((task) => (task.id === serverTask.id ? serverTask : task));
            const normalizedSource = normalizeColumnPositions(mergedTasks, serverTask.status);
            queryClient.setQueryData(queryKey, normalizedSource);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
};
