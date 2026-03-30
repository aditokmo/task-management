import { create } from 'zustand';

interface TaskUIState {
    isCreateDialogOpen: boolean;
    isTaskDetailOpen: boolean;
    selectedTaskId: string | null;
    openCreateDialog: () => void;
    closeCreateDialog: () => void;
    openTaskDetail: (taskId: string) => void;
    closeTaskDetail: () => void;
}

export const useTaskUIStore = create<TaskUIState>((set) => ({
    isCreateDialogOpen: false,
    isTaskDetailOpen: false,
    selectedTaskId: null,

    openCreateDialog: () => set({ isCreateDialogOpen: true }),
    closeCreateDialog: () => set({ isCreateDialogOpen: false }),
    openTaskDetail: (taskId: string) =>
        set({
            isTaskDetailOpen: true,
            selectedTaskId: taskId,
        }),
    closeTaskDetail: () =>
        set({
            isTaskDetailOpen: false,
            selectedTaskId: null,
        }),
}));
