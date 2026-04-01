import { TASK_PRIORITY } from '../types';
import type { Task, TaskFormData } from '../types';
import { formatDateForInput } from './date.utils';

export const getDefaultFormData = (): TaskFormData => ({
    title: '',
    description: '',
    assigneeName: '',
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: '',
});

export const mapTaskToFormData = (task: Task | null): TaskFormData => {
    if (!task) {
        return getDefaultFormData();
    }

    return {
        title: task.title,
        description: task.description ?? '',
        assigneeName: task.assigneeName ?? '',
        priority: task.priority,
        dueDate: formatDateForInput(task.dueDate),
    };
};
