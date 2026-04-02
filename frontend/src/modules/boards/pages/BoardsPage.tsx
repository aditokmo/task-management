import { Outlet, useMatchRoute, useNavigate } from '@tanstack/react-router';
import { FolderOpen, Plus, Settings, Trash2, Edit2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useBoards, useOpenBoard, useUpdateBoard, useDeleteBoard } from '../hooks';

export function BoardsPage() {
    const matchRoute = useMatchRoute();
    const navigate = useNavigate();
    const { data: boards = [], isLoading } = useBoards();
    const createBoard = useOpenBoard();
    const updateBoard = useUpdateBoard();
    const deleteBoard = useDeleteBoard();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [boardName, setBoardName] = useState('');
    const [memberEmails, setMemberEmails] = useState<string[]>(['']);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
    const [editBoardName, setEditBoardName] = useState('');
    const [editMemberEmails, setEditMemberEmails] = useState<string[]>(['']);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState<{ id: string; name: string } | null>(null);

    const canSubmit = useMemo(() => boardName.trim().length >= 2, [boardName]);
    const canEditSubmit = useMemo(() => editBoardName.trim().length >= 2, [editBoardName]);

    const addMemberInput = () => {
        setMemberEmails((previous) => [...previous, '']);
    };

    const updateMemberEmail = (index: number, value: string) => {
        setMemberEmails((previous) => previous.map((email, itemIndex) => (itemIndex === index ? value : email)));
    };

    const removeMemberEmail = (index: number) => {
        setMemberEmails((previous) => {
            if (previous.length === 1) {
                return [''];
            }

            return previous.filter((_, itemIndex) => itemIndex !== index);
        });
    };

    const resetCreateForm = () => {
        setBoardName('');
        setMemberEmails(['']);
    };

    const handleOpenEditModal = (event: React.MouseEvent, board: { id: string; name: string }) => {
        event.stopPropagation();
        setEditingBoardId(board.id);
        setEditBoardName(board.name);
        setEditMemberEmails(['']);
        setIsEditModalOpen(true);
    };

    const resetEditForm = () => {
        setEditingBoardId(null);
        setEditBoardName('');
        setEditMemberEmails(['']);
    };

    const addEditMemberInput = () => {
        setEditMemberEmails((previous) => [...previous, '']);
    };

    const updateEditMemberEmail = (index: number, value: string) => {
        setEditMemberEmails((previous) => previous.map((email, itemIndex) => (itemIndex === index ? value : email)));
    };

    const removeEditMemberEmail = (index: number) => {
        setEditMemberEmails((previous) => {
            if (previous.length === 1) {
                return [''];
            }
            return previous.filter((_, itemIndex) => itemIndex !== index);
        });
    };

    const handleEdit = async () => {
        if (!editingBoardId) return;
        const trimmed = editBoardName.trim();
        if (!trimmed) return;

        const normalizedEmails = Array.from(
            new Set(
                editMemberEmails
                    .map((email) => email.trim().toLowerCase())
                    .filter((email) => email.length > 0),
            ),
        );

        await updateBoard.mutateAsync({
            boardId: editingBoardId,
            name: trimmed,
            memberEmails: normalizedEmails,
        });
        resetEditForm();
        setIsEditModalOpen(false);
    };

    const handleCreate = async () => {
        const trimmed = boardName.trim();
        if (!trimmed) {
            return;
        }

        const normalizedEmails = Array.from(
            new Set(
                memberEmails
                    .map((email) => email.trim().toLowerCase())
                    .filter((email) => email.length > 0),
            ),
        );

        await createBoard.mutateAsync({
            name: trimmed,
            memberEmails: normalizedEmails,
        });
        resetCreateForm();
        setIsCreateModalOpen(false);
    };

    const handleOpenBoard = async (boardId: string) => {
        await navigate({ to: '/boards/$boardId', params: { boardId } });
    };

    const handleDeleteClick = (event: React.MouseEvent, board: { id: string; name: string }) => {
        event.stopPropagation();
        setBoardToDelete(board);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!boardToDelete) return;
        await deleteBoard.mutateAsync(boardToDelete.id);
        setIsDeleteConfirmOpen(false);
        setBoardToDelete(null);
    };

    const isBoardDetailRoute = Boolean(matchRoute({ to: '/boards/$boardId' }));

    if (isBoardDetailRoute) {
        return <Outlet />;
    }

    return (
        <main className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
                <header className="flex items-center justify-between rounded-xl border bg-card/90 p-4">
                    <div className="flex-col">
                        <h1 className="text-xl font-semibold tracking-tight">Boards</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select one of your boards or create a new board for your team.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="size-4" />
                        New Board
                    </Button>
                </header>

                <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold">Your boards</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {isLoading ? (
                            <Card>
                                <CardContent className="py-6 text-sm text-muted-foreground">Loading boards...</CardContent>
                            </Card>
                        ) : boards.length === 0 ? (
                            <Card>
                                <CardContent className="py-6 text-sm text-muted-foreground">
                                    No boards yet. Create your first one with the New Board button.
                                </CardContent>
                            </Card>
                        ) : (
                            boards.map((board) => (
                                <Card key={board.id} className="cursor-pointer transition hover:bg-accent/40">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                        <CardTitle className="text-base">{board.name}</CardTitle>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="-mt-1 -mr-1 shrink-0"
                                                    aria-label="Board settings"
                                                >
                                                    <Settings className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(event) => handleOpenEditModal(event as any, board)}>
                                                    <Edit2 className="size-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={(event) => handleDeleteClick(event as any, board)}
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between gap-3">
                                        <span className="text-xs text-muted-foreground">
                                            Updated {new Date(board.updatedAt).toLocaleDateString()}
                                        </span>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleOpenBoard(board.id)}
                                        >
                                            <FolderOpen className="size-4" />
                                            Open
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                <Dialog
                    open={isEditModalOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            resetEditForm();
                        }
                        setIsEditModalOpen(open);
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit board</DialogTitle>
                            <DialogDescription>
                                Update the board name or add new members by email.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Project name</p>
                                <Input
                                    value={editBoardName}
                                    onChange={(event) => setEditBoardName(event.target.value)}
                                    placeholder="Website redesign"
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && canEditSubmit && !updateBoard.isPending) {
                                            handleEdit();
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium">Add members (emails)</p>
                                    <Button type="button" variant="outline" size="sm" onClick={addEditMemberInput}>
                                        <Plus className="size-4" />
                                        Add email
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {editMemberEmails.map((email, index) => (
                                        <div key={`edit-member-email-${index}`} className="flex items-center gap-2">
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(event) => updateEditMemberEmail(index, event.target.value)}
                                                placeholder="teammate@example.com"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => removeEditMemberEmail(index)}
                                                aria-label="Remove email field"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    resetEditForm();
                                    setIsEditModalOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleEdit} disabled={!canEditSubmit || updateBoard.isPending}>
                                {updateBoard.isPending ? 'Saving...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a new board</DialogTitle>
                            <DialogDescription>
                                Add a project name and optional member emails. Only invited users will see this board.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Project name</p>
                                <Input
                                    value={boardName}
                                    onChange={(event) => setBoardName(event.target.value)}
                                    placeholder="Website redesign"
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && canSubmit && !createBoard.isPending) {
                                            handleCreate();
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium">Members (emails)</p>
                                    <Button type="button" variant="outline" size="sm" onClick={addMemberInput}>
                                        <Plus className="size-4" />
                                        Add email
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {memberEmails.map((email, index) => (
                                        <div key={`member-email-${index}`} className="flex items-center gap-2">
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(event) => updateMemberEmail(index, event.target.value)}
                                                placeholder="teammate@example.com"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => removeMemberEmail(index)}
                                                aria-label="Remove email field"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    resetCreateForm();
                                    setIsCreateModalOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleCreate} disabled={!canSubmit || createBoard.isPending}>
                                {createBoard.isPending ? 'Creating...' : 'Create board'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete board</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{boardToDelete?.name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteConfirmOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={deleteBoard.isPending}
                            >
                                {deleteBoard.isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </main>
    );
}
