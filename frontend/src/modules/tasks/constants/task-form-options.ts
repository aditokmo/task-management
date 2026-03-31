import { TASK_PRIORITY, TASK_STATUS, type TaskPriority, type TaskStatus } from '../types';

export const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
    { value: TASK_PRIORITY.LOW, label: 'Low' },
    { value: TASK_PRIORITY.MEDIUM, label: 'Medium' },
    { value: TASK_PRIORITY.HIGH, label: 'High' },
];

export const statusOptions: Array<{ value: TaskStatus; label: string }> = [
    { value: TASK_STATUS.BACKLOG, label: 'Backlog' },
    { value: TASK_STATUS.TODO, label: 'Todo' },
    { value: TASK_STATUS.IN_PROGRESS, label: 'In-Progress' },
    { value: TASK_STATUS.DONE, label: 'Done' },
];
