import { z } from 'zod';
import { TASK_PRIORITY, TASK_STATUS } from '../types';

export const createTaskSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    description: z.string().max(1000, 'Description is too long').optional(),
    priority: z.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]),
    status: z.enum([TASK_STATUS.BACKLOG, TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]),
    dueDate: z.string().min(1, 'Due date is required'),
    assigneeName: z.string().max(120, 'Assignee name is too long').optional(),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
