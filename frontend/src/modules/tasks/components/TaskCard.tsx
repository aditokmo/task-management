import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task } from '../types';

interface TaskCardProps {
    task: Task;
    onClick: (taskId: string) => void;
}

const priorityVariantMap: Record<Task['priority'], 'outline' | 'secondary' | 'destructive'> = {
    low: 'outline',
    medium: 'secondary',
    high: 'destructive',
};

const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    if (Number.isNaN(date.getTime())) {
        return 'No due date';
    }

    return date.toLocaleDateString();
};

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
                <span>{formatDueDate(task.dueDate)}</span>
            </CardContent>
        </Card>
    );
}
