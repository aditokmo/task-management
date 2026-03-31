import { TASK_STATUS, type TaskStatus } from '../types';

export interface ColumnConfig {
    status: TaskStatus;
    title: string;
}

export const KANBAN_COLUMNS: ColumnConfig[] = [
    { status: TASK_STATUS.BACKLOG, title: 'Backlog' },
    { status: TASK_STATUS.TODO, title: 'Todo' },
    { status: TASK_STATUS.IN_PROGRESS, title: 'In-Progress' },
    { status: TASK_STATUS.DONE, title: 'Done' },
];