import type { CreateTaskFormValues } from '../schemas';
import { TASK_PRIORITY, TASK_STATUS } from '../types';

export const CREATE_TASK_DEFAULT_VALUES: CreateTaskFormValues = {
    title: '',
    description: '',
    priority: TASK_PRIORITY.MEDIUM,
    status: TASK_STATUS.BACKLOG,
    dueDate: '',
    assigneeName: '',
};
