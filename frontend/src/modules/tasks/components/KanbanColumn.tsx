import { memo } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
    status: TaskStatus;
    title: string;
    tasks: Task[];
    onTaskClick: (taskId: string) => void;
}

function KanbanColumnComponent({ status, title, tasks, onTaskClick }: KanbanColumnProps) {
    return (
        <div className="flex min-h-[24rem] flex-col rounded-xl border bg-background/60 p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tasks.length}</span>
            </div>

            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex min-h-20 flex-1 flex-col gap-2 rounded-lg p-1 transition ${snapshot.isDraggingOver ? 'bg-accent/40' : 'bg-transparent'
                            }`}
                    >
                        {tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(draggableProvided, draggableSnapshot) => (
                                    <div
                                        ref={draggableProvided.innerRef}
                                        {...draggableProvided.draggableProps}
                                        {...draggableProvided.dragHandleProps}
                                        className={draggableSnapshot.isDragging ? 'opacity-90' : ''}
                                    >
                                        <TaskCard task={task} onClick={onTaskClick} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export const KanbanColumn = memo(KanbanColumnComponent);
