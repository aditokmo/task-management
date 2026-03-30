import { createFileRoute } from '@tanstack/react-router'
import { KanbanDashboard } from '@/modules/tasks/pages';

export const Route = createFileRoute('/_protected/')({
    component: () => <KanbanDashboard />,
})