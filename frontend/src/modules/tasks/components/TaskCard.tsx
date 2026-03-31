import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { priorityVariantMap } from '../constants';
import type { Task } from '../types';
import { formatTaskDueDate } from '../utils';

interface TaskCardProps {
    task: Task;
    onClick: (taskId: string) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
    return (
        <Card
            className="task-card cursor-pointer border-border/70 bg-card/95 transition hover:bg-accent/40"
            size="sm"
            onClick={() => onClick(task.id)}
        >
            <CardHeader className="pb-1">
                <CardTitle className="line-clamp-2 text-sm">{task.title}</CardTitle>
            </CardHeader>

            <CardContent className="flex items-center justify-between gap-2 pb-1 text-xs text-muted-foreground">
                <Badge variant={priorityVariantMap[task.priority]}>{task.priority.toUpperCase()}</Badge>
                <span>{formatTaskDueDate(task.dueDate)}</span>
            </CardContent>
        </Card>
    );
}
