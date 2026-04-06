import { Outlet, useMatchRoute, useNavigate } from '@tanstack/react-router';
import { Edit2, FolderOpen, Plus, Settings, Trash2, Users } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore, useBoardUIStore } from '@/store';
import { useAddBoardMembers, useBoardMembers, useBoards, useDeleteBoard, useOpenBoard, useRemoveBoardMember, useUpdateBoard } from '../hooks';

const normalizeEmails = (emails: string[]) =>
    emails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0);

const getDuplicateEmails = (emails: string[]) => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const email of emails) {
        if (seen.has(email)) {
            duplicates.add(email);
            continue;
        }
        seen.add(email);
    }

    return Array.from(duplicates);
};

export function BoardsPage() {
    const matchRoute = useMatchRoute();
    const navigate = useNavigate();
    const currentUserId = useAuthStore((state) => state.user?.id);
    const currentUserEmail = useAuthStore((state) => state.user?.email?.toLowerCase() ?? '');
    const { data: boards = [], isLoading } = useBoards();
    const createBoard = useOpenBoard();
    const isCreateModalOpen = useBoardUIStore((state) => state.isCreateDialogOpen);
    const openCreateBoardDialog = useBoardUIStore((state) => state.openCreateDialog);
    const closeCreateBoardDialog = useBoardUIStore((state) => state.closeCreateDialog);
    const updateBoard = useUpdateBoard();
    const addBoardMembers = useAddBoardMembers();
    const removeBoardMember = useRemoveBoardMember();
    const deleteBoard = useDeleteBoard();
    const [boardName, setBoardName] = useState('');
    const [memberEmails, setMemberEmails] = useState<string[]>(['']);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
    const [editBoardName, setEditBoardName] = useState('');
    const [editMemberEmails, setEditMemberEmails] = useState<string[]>(['']);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState<{ id: string; name: string } | null>(null);

    const editingBoard = useMemo(
        () => boards.find((board) => board.id === editingBoardId) ?? null,
        [boards, editingBoardId],
    );
    const canManageEditingBoard = Boolean(editingBoard && editingBoard.ownerId === currentUserId);

    const boardMembers = useBoardMembers(
        editingBoardId ?? '',
        isEditModalOpen && Boolean(editingBoardId) && canManageEditingBoard,
    );

    const normalizedMemberEmails = useMemo(() => normalizeEmails(memberEmails), [memberEmails]);
    const duplicateCreateEmails = useMemo(() => getDuplicateEmails(normalizedMemberEmails), [normalizedMemberEmails]);
    const createIncludesOwnerEmail = useMemo(
        () => Boolean(currentUserEmail && normalizedMemberEmails.includes(currentUserEmail)),
        [currentUserEmail, normalizedMemberEmails],
    );

    const normalizedEditEmails = useMemo(() => normalizeEmails(editMemberEmails), [editMemberEmails]);
    const duplicateEditEmails = useMemo(() => getDuplicateEmails(normalizedEditEmails), [normalizedEditEmails]);
    const editIncludesOwnerEmail = useMemo(
        () => Boolean(currentUserEmail && normalizedEditEmails.includes(currentUserEmail)),
        [currentUserEmail, normalizedEditEmails],
    );
    const existingMemberEmails = useMemo(
        () =>
            new Set(
                (boardMembers.data?.members ?? [])
                    .filter((member) => member.role === 'member' && member.status !== 'declined')
                    .map((member) => member.email.toLowerCase()),
            ),
        [boardMembers.data?.members],
    );
    const alreadyAddedEmails = useMemo(
        () => Array.from(new Set(normalizedEditEmails.filter((email) => existingMemberEmails.has(email)))),
        [existingMemberEmails, normalizedEditEmails],
    );

    const isSavingEdit = updateBoard.isPending || addBoardMembers.isPending;
    const canSubmit = useMemo(
        () => boardName.trim().length >= 2 && duplicateCreateEmails.length === 0 && !createIncludesOwnerEmail,
        [boardName, createIncludesOwnerEmail, duplicateCreateEmails.length],
    );
    const canEditSubmit = useMemo(
        () =>
            editBoardName.trim().length >= 2 &&
            duplicateEditEmails.length === 0 &&
            !editIncludesOwnerEmail &&
            alreadyAddedEmails.length === 0,
        [editBoardName, duplicateEditEmails.length, editIncludesOwnerEmail, alreadyAddedEmails.length],
    );

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
        setIsMembersModalOpen(false);
        setIsEditModalOpen(true);
    };

    const resetEditForm = () => {
        setEditingBoardId(null);
        setEditBoardName('');
        setEditMemberEmails(['']);
        setRemovingMemberId(null);
        setIsMembersModalOpen(false);
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
        if (!editingBoardId || !canManageEditingBoard) return;
        const trimmed = editBoardName.trim();
        if (!trimmed) return;

        if (editingBoard && trimmed !== editingBoard.name.trim()) {
            await updateBoard.mutateAsync({
                boardId: editingBoardId,
                name: trimmed,
            });
        }

        if (normalizedEditEmails.length) {
            await addBoardMembers.mutateAsync({
                boardId: editingBoardId,
                memberEmails: normalizedEditEmails,
            });
        }

        resetEditForm();
        setIsEditModalOpen(false);
    };

    const handleCreate = async () => {
        const trimmed = boardName.trim();
        if (!trimmed) {
            return;
        }

        await createBoard.mutateAsync({
            name: trimmed,
            memberEmails: normalizedMemberEmails,
        });
        resetCreateForm();
        closeCreateBoardDialog();
    };

    const handleRemoveMember = async (memberUserId: string) => {
        if (!editingBoardId) {
            return;
        }

        setRemovingMemberId(memberUserId);
        try {
            await removeBoardMember.mutateAsync({
                boardId: editingBoardId,
                memberUserId,
            });
        } finally {
            setRemovingMemberId(null);
        }
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
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
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
                                <Card key={board.id} className="cursor-pointer transition">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                        <CardTitle className="text-base">{board.name}</CardTitle>
                                        {board.ownerId === currentUserId ? (
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
                                                    <DropdownMenuItem onClick={(event) => handleOpenEditModal(event, board)}>
                                                        <Edit2 className="size-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={(event) => handleDeleteClick(event, board)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <span className="inline-block h-8 w-8" aria-hidden="true" />
                                        )}
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
                                Update the board name, add members, or open the members list to remove users.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {!canManageEditingBoard ? (
                                <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                    Only the board owner can edit members.
                                </p>
                            ) : null}

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Project name</p>
                                <Input
                                    value={editBoardName}
                                    onChange={(event) => setEditBoardName(event.target.value)}
                                    placeholder="Website redesign"
                                    disabled={!canManageEditingBoard}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && canEditSubmit && !isSavingEdit && canManageEditingBoard) {
                                            handleEdit();
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium">Add members (emails)</p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setIsMembersModalOpen(true)}
                                            disabled={!canManageEditingBoard}
                                        >
                                            <Users className="size-4" />
                                            Members
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addEditMemberInput}
                                            disabled={!canManageEditingBoard}
                                        >
                                            <Plus className="size-4" />
                                            Add email
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {editMemberEmails.map((email, index) => (
                                        <div key={`edit-member-email-${index}`} className="flex items-center gap-2">
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(event) => updateEditMemberEmail(index, event.target.value)}
                                                placeholder="teammate@example.com"
                                                disabled={!canManageEditingBoard}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => removeEditMemberEmail(index)}
                                                aria-label="Remove email field"
                                                disabled={!canManageEditingBoard}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {duplicateEditEmails.length > 0 ? (
                                    <p className="text-sm text-destructive">
                                        You already entered this email: {duplicateEditEmails.join(', ')}.
                                    </p>
                                ) : null}

                                {editIncludesOwnerEmail ? (
                                    <p className="text-sm text-destructive">
                                        You cannot add yourself. You are already the board owner.
                                    </p>
                                ) : null}

                                {alreadyAddedEmails.length > 0 ? (
                                    <p className="text-sm text-destructive">
                                        This email is already in the board: {alreadyAddedEmails.join(', ')}.
                                    </p>
                                ) : null}
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
                            <Button type="button" onClick={handleEdit} disabled={!canEditSubmit || isSavingEdit || !canManageEditingBoard}>
                                {isSavingEdit ? 'Saving...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Board members</DialogTitle>
                            <DialogDescription>
                                View everyone in this board and remove members when needed.
                            </DialogDescription>
                        </DialogHeader>

                        {boardMembers.isLoading ? (
                            <p className="text-sm text-muted-foreground">Loading members...</p>
                        ) : boardMembers.data ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {boardMembers.data.members.map((member) => {
                                        const isRemoving = removeBoardMember.isPending && removingMemberId === member.id;
                                        const isOwner = member.role === 'owner';

                                        return (
                                            <TableRow key={member.id}>
                                                <TableCell>{member.name || 'Unnamed user'}</TableCell>
                                                <TableCell>{member.email}</TableCell>
                                                <TableCell className="capitalize">{member.role}</TableCell>
                                                <TableCell className="capitalize">{member.status}</TableCell>
                                                <TableCell className="text-right">
                                                    {isOwner ? (
                                                        <span className="text-xs text-muted-foreground">Cannot remove owner</span>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleRemoveMember(member.id)}
                                                            disabled={removeBoardMember.isPending}
                                                        >
                                                            {isRemoving ? 'Removing...' : 'Remove'}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-sm text-muted-foreground">Unable to load members.</p>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isCreateModalOpen}
                    onOpenChange={(open) => {
                        if (open) {
                            openCreateBoardDialog();
                            return;
                        }

                        resetCreateForm();
                        closeCreateBoardDialog();
                    }}
                >
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

                                {duplicateCreateEmails.length > 0 ? (
                                    <p className="text-sm text-destructive">
                                        You already entered this email: {duplicateCreateEmails.join(', ')}.
                                    </p>
                                ) : null}

                                {createIncludesOwnerEmail ? (
                                    <p className="text-sm text-destructive">
                                        You cannot add yourself. You are already the board owner.
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    resetCreateForm();
                                    closeCreateBoardDialog();
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
