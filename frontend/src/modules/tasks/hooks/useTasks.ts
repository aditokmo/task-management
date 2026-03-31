import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskService } from '../services';
import type { CreateTaskPayload, MoveTaskPayload, Task, TaskStatus, UpdateTaskPayload } from '../types';

export const TASKS_QUERY_KEY = ['tasks'] as const;

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

export const useTasks = () => {
    return useQuery({
        queryKey: TASKS_QUERY_KEY,
        queryFn: TaskService.list,
        staleTime: 10 * 1000,
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTaskPayload) => TaskService.create(payload),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
            const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];

            const nextPosition = previousTasks.filter((task) => task.status === payload.status).length;
            const optimisticTask: Task = {
                id: `temp-${Date.now()}`,
                title: payload.title,
                description: payload.description ?? '',
                priority: payload.priority,
                status: payload.status,
                dueDate: payload.dueDate,
                position: nextPosition,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...(payload.assigneeId ? { assigneeId: payload.assigneeId } : {}),
                ...(payload.assigneeName ? { assigneeName: payload.assigneeName } : {}),
            };

            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, [...previousTasks, optimisticTask]);

            return { previousTasks, optimisticTaskId: optimisticTask.id };
        },
        onError: (_error, _payload, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
            }
        },
        onSuccess: (createdTask, _payload, context) => {
            const currentTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];
            const withServerTask = currentTasks.map((task) => {
                if (task.id === context?.optimisticTaskId) {
                    return createdTask;
                }

                return task;
            });

            queryClient.setQueryData(TASKS_QUERY_KEY, withServerTask);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, payload }: UpdateTaskInput) => TaskService.update(taskId, payload),
        onMutate: async ({ taskId, payload }) => {
            await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
            const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];

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

            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, nextTasks);

            return { previousTasks };
        },
        onError: (_error, _payload, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
            }
        },
        onSuccess: (updatedTask) => {
            const currentTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];
            const mergedTasks = currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
            queryClient.setQueryData(TASKS_QUERY_KEY, mergedTasks);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        },
    });
};

export const useMoveTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, status, position }: MoveTaskInput) =>
            TaskService.move(taskId, { status, position }),
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
            const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];

            const optimisticTasks = optimisticMove(previousTasks, input);
            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, optimisticTasks);

            return { previousTasks };
        },
        onError: (_error, _input, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
            }
        },
        onSuccess: (serverTask) => {
            const currentTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY) ?? [];
            const mergedTasks = currentTasks.map((task) => (task.id === serverTask.id ? serverTask : task));
            const normalizedSource = normalizeColumnPositions(mergedTasks, serverTask.status);
            queryClient.setQueryData(TASKS_QUERY_KEY, normalizedSource);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        },
    });
};
