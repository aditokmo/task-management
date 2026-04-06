import { create } from 'zustand';

interface BoardUIState {
    isCreateDialogOpen: boolean;
    openCreateDialog: () => void;
    closeCreateDialog: () => void;
}

export const useBoardUIStore = create<BoardUIState>((set) => ({
    isCreateDialogOpen: false,
    openCreateDialog: () => set({ isCreateDialogOpen: true }),
    closeCreateDialog: () => set({ isCreateDialogOpen: false }),
}));
