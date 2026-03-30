import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { TASKS_QUERY_KEY } from './useTasks';
import type { Task, TaskStatus } from '../types';

interface TaskMovedEvent {
    taskId: string;
    status: TaskStatus;
    position: number;
}

interface TaskDeletedEvent {
    taskId: string;
}

const resolveSocketUrl = () => {
    const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;
    if (explicitSocketUrl) {
        return explicitSocketUrl;
    }

    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (!apiUrl) {
        return 'http://localhost:8000';
    }

    return apiUrl.replace(/\/api\/v\d+\/?$/, '');
};

export const useTaskSocketSync = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = io(resolveSocketUrl(), {
            withCredentials: true,
            transports: ['websocket'],
        });

        const updateTaskInCache = (incomingTask: Task) => {
            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (currentTasks = []) => {
                const taskExists = currentTasks.some((task) => task.id === incomingTask.id);
                if (!taskExists) {
                    return [...currentTasks, incomingTask];
                }

                return currentTasks.map((task) => (task.id === incomingTask.id ? incomingTask : task));
            });
        };

        socket.on('task-updated', (task: Task) => {
            updateTaskInCache(task);
        });

        socket.on('task-moved', (event: Task | TaskMovedEvent) => {
            if ('id' in event) {
                updateTaskInCache(event);
                return;
            }

            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (currentTasks = []) => {
                return currentTasks.map((task) => {
                    if (task.id !== event.taskId) {
                        return task;
                    }

                    return {
                        ...task,
                        status: event.status,
                        position: event.position,
                        updatedAt: new Date().toISOString(),
                    };
                });
            });
        });

        socket.on('task-created', (task: Task) => {
            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (currentTasks = []) => {
                const taskExists = currentTasks.some((item) => item.id === task.id);
                return taskExists ? currentTasks : [...currentTasks, task];
            });
        });

        socket.on('task-deleted', (event: TaskDeletedEvent) => {
            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (currentTasks = []) => {
                return currentTasks.filter((task) => task.id !== event.taskId);
            });
        });

        return () => {
            socket.off('task-updated');
            socket.off('task-moved');
            socket.off('task-created');
            socket.off('task-deleted');
            socket.disconnect();
        };
    }, [queryClient]);
};
