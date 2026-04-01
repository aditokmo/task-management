export const TASK_STATUS = {
    BACKLOG: 'backlog',
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    DONE: 'done',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    boardId: string;
    assigneeId?: string;
    assigneeName?: string;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface ListTasksResponse {
    data: Task[];
}

export interface CreateTaskPayload {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    boardId: string;
    assigneeId?: string;
    assigneeName?: string;
}

export interface CreateTaskOptions {
    barearToken?: string | null;
}

export interface UpdateTaskPayload {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
    assigneeName?: string;
    status?: TaskStatus;
    position?: number;
}

export interface MoveTaskPayload {
    status: TaskStatus;
    position: number;
}

export interface TaskResponse {
    data: Task;
}

export interface DeleteTaskResponse {
    success: boolean;
}

export interface TaskFormData {
    title: string;
    description: string;
    assigneeName: string;
    priority: TaskPriority;
    dueDate: string;
}
