import { Outlet, useMatchRoute, useNavigate } from '@tanstack/react-router';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useBoards, useOpenBoard } from '../hooks';

export function BoardsPage() {
    const matchRoute = useMatchRoute();
    const navigate = useNavigate();
    const { data: boards = [], isLoading } = useBoards();
    const createBoard = useOpenBoard();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [boardName, setBoardName] = useState('');
    const [memberEmails, setMemberEmails] = useState<string[]>(['']);

    const canSubmit = useMemo(() => boardName.trim().length >= 2, [boardName]);

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
                                    <CardHeader>
                                        <CardTitle className="text-base">{board.name}</CardTitle>
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
            </div>
        </main>
    );
}
