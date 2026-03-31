import type { Task } from '../types';

export const priorityVariantMap: Record<Task['priority'], 'outline' | 'secondary' | 'destructive'> = {
    low: 'outline',
    medium: 'secondary',
    high: 'destructive',
};