import { ApiService } from '@/api';
import type {
    CreateTaskPayload,
    ListTasksResponse,
    MoveTaskPayload,
    Task,
    TaskResponse,
    UpdateTaskPayload,
} from '../types';
import { ENDPOINTS } from './endpoint';
import type { AxiosRequestConfig } from 'axios';

const normalizeTaskList = (response: Task[] | ListTasksResponse): Task[] => {
    return Array.isArray(response) ? response : response.data;
};

const normalizeTask = (response: Task | TaskResponse): Task => {
    return 'data' in response ? response.data : response;
};

export const TaskService = {
    list: async (options?: AxiosRequestConfig): Promise<Task[]> => {
        const response = await ApiService.get<Task[] | ListTasksResponse>(ENDPOINTS.TASKS.LIST, options);
        return normalizeTaskList(response);
    },

    create: async (payload: CreateTaskPayload, options?: AxiosRequestConfig): Promise<Task> => {
        const response = await ApiService.post<CreateTaskPayload, Task | TaskResponse>(ENDPOINTS.TASKS.CREATE, payload, options);
        return normalizeTask(response);
    },

    update: async (taskId: string, payload: UpdateTaskPayload, options?: AxiosRequestConfig): Promise<Task> => {
        const response = await ApiService.patch<UpdateTaskPayload, Task | TaskResponse>(ENDPOINTS.TASKS.BY_ID(taskId), payload, options);
        return normalizeTask(response);
    },

    move: async (taskId: string, payload: MoveTaskPayload, options?: AxiosRequestConfig): Promise<Task> => {
        const response = await ApiService.patch<MoveTaskPayload, Task | TaskResponse>(ENDPOINTS.TASKS.MOVE(taskId), payload, options);
        return normalizeTask(response);
    },
};
