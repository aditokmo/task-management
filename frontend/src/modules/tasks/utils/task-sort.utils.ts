import type { Task } from '../types';

export const sortTasksByPosition = (tasks: Task[]) => {
    return [...tasks].sort((left, right) => left.position - right.position);
};