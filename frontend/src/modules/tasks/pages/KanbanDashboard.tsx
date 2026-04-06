import { useNavigate } from '@tanstack/react-router';
import { Check, ChevronDown, Search, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAddBoardMembers, useBoardMembers, useBoards } from '@/modules/boards/hooks';
import { KanbanBoard, NewTaskDialog, TaskDetailSheet } from '../components';

interface KanbanDashboardProps {
    boardId: string;
    boardName: string;
    canManageMembers: boolean;
}

export function KanbanDashboard({ boardId, boardName, canManageMembers }: KanbanDashboardProps) {
    const navigate = useNavigate();
    const { data: boards, isLoading: isLoadingBoards } = useBoards();
    const { data: boardMembersData } = useBoardMembers(boardId);
    const addBoardMembers = useAddBoardMembers();
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [isMemberFilterOpen, setIsMemberFilterOpen] = useState(false);
    const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
    const [inviteEmailsInput, setInviteEmailsInput] = useState('');

    const visibleMembers = useMemo(
        () =>
            (boardMembersData?.members ?? []).filter(
                (member) => member.role === 'owner' || member.status === 'accepted',
            ),
        [boardMembersData?.members],
    );

    const handleBoardSwitch = (nextBoardId: string) => {
        if (nextBoardId === boardId) {
            return;
        }

        navigate({ to: '/boards/$boardId', params: { boardId: nextBoardId } });
    };

    const visibleAvatarMembers =
        visibleMembers.length > 3 ? visibleMembers.slice(0, 2) : visibleMembers;
    const hiddenMemberCount = visibleMembers.length > 3 ? visibleMembers.length - 2 : 0;
    const normalizedMemberSearch = memberSearch.trim().toLowerCase();

    const filteredMembers = useMemo(
        () =>
            normalizedMemberSearch.length === 0
                ? visibleMembers
                : visibleMembers.filter((member) => {
                    const name = member.name?.toLowerCase() ?? '';
                    const email = member.email.toLowerCase();
                    return name.includes(normalizedMemberSearch) || email.includes(normalizedMemberSearch);
                }),
        [normalizedMemberSearch, visibleMembers],
    );

    const parsedInviteEmails = useMemo(
        () =>
            Array.from(
                new Set(
                    inviteEmailsInput
                        .split(/[\s,;]+/)
                        .map((email) => email.trim().toLowerCase())
                        .filter((email) => email.length > 0),
                ),
            ),
        [inviteEmailsInput],
    );

    const toggleMemberFilter = (memberId: string) => {
        setSelectedAssigneeIds((current) =>
            current.includes(memberId)
                ? current.filter((id) => id !== memberId)
                : [...current, memberId],
        );
    };

    const handleAddMembers = async () => {
        if (parsedInviteEmails.length === 0) {
            return;
        }

        await addBoardMembers.mutateAsync({
            boardId,
            memberEmails: parsedInviteEmails,
        });

        setInviteEmailsInput('');
        setIsAddMembersOpen(false);
    };

    return (
        <main className="px-4 pb-5 sm:px-6 sm:pb-6">
            <header className="sticky top-[61px] z-30 -mx-4 border-b border-border/70 bg-background/95 backdrop-blur-xl sm:-mx-6">
                <div className="px-4 sm:px-6">
                    <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <h1 className="truncate text-xl font-semibold tracking-tight">{boardName}</h1>

                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-input bg-background px-2.5 transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                    disabled={isLoadingBoards || !boards?.length}
                                    aria-label="Switch board"
                                >
                                    <ChevronDown className="size-4" />
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="start" className="min-w-52">
                                    {boards?.map((board) => (
                                        <DropdownMenuItem
                                            key={board.id}
                                            onClick={() => handleBoardSwitch(board.id)}
                                            disabled={board.id === boardId}
                                        >
                                            {board.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center">
                                {visibleAvatarMembers.map((member, index) => {
                                    const label = member.name || member.email;
                                    const initials = (member.name || member.email || 'U')
                                        .split(/\s+/)
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((part) => part[0]?.toUpperCase() ?? '')
                                        .join('');

                                    return (
                                        <div
                                            key={member.id}
                                            className={[
                                                'relative rounded-full ring-2 ring-background shadow-sm',
                                                index !== 0 ? '-ml-1' : '',
                                            ].join(' ')}
                                            title={label}
                                            aria-label={label}
                                        >
                                            <Avatar size="sm" className="bg-muted/80">
                                                {member.profileImage ? <AvatarImage src={member.profileImage} alt={label} /> : null}
                                                <AvatarFallback>{initials || 'U'}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    );
                                })}

                                {hiddenMemberCount > 0 ? (
                                    <div
                                        className="relative -ml-1 inline-flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground ring-2 ring-background shadow-sm"
                                        title={`${hiddenMemberCount} more members`}
                                        aria-label={`${hiddenMemberCount} more members`}
                                    >
                                        +{hiddenMemberCount}
                                    </div>
                                ) : null}
                            </div>

                            <DropdownMenu open={isMemberFilterOpen} onOpenChange={setIsMemberFilterOpen}>
                                <DropdownMenuTrigger
                                    className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-input bg-background px-2.5 text-sm transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                                    aria-label="Filter tasks by members"
                                >
                                    <ChevronDown className="size-4" />
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="min-w-56">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setSelectedAssigneeIds([]);
                                        }}
                                        className="flex w-full items-center rounded-md px-1.5 py-1 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                                        disabled={selectedAssigneeIds.length === 0}
                                    >
                                        Clear all
                                    </button>
                                    <DropdownMenuSeparator />

                                    <div className="px-1 pb-2">
                                        <label className="relative block">
                                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                value={memberSearch}
                                                onChange={(event) => setMemberSearch(event.target.value)}
                                                onClick={(event) => event.stopPropagation()}
                                                onKeyDown={(event) => event.stopPropagation()}
                                                onFocus={(event) => event.stopPropagation()}
                                                placeholder="Search members"
                                                className="h-8 pl-8"
                                                autoFocus
                                            />
                                        </label>
                                    </div>

                                    {filteredMembers.map((member) => {
                                        const label = member.name || member.email;
                                        const isSelected = selectedAssigneeIds.includes(member.id);

                                        return (
                                            <button
                                                type="button"
                                                key={member.id}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    toggleMemberFilter(member.id);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                            >
                                                <span
                                                    className={[
                                                        'inline-flex size-4 items-center justify-center rounded-[4px] border transition-colors',
                                                        isSelected
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-background text-transparent',
                                                    ].join(' ')}
                                                >
                                                    <Check className="size-3" />
                                                </span>
                                                {label}
                                            </button>
                                        );
                                    })}

                                    {filteredMembers.length === 0 ? (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No members found.</div>
                                    ) : null}

                                    {canManageMembers ? (
                                        <>
                                            <DropdownMenuSeparator />
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    setIsMemberFilterOpen(false);
                                                    setIsAddMembersOpen(true);
                                                }}
                                                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                            >
                                                <UserPlus className="size-4" />
                                                Add members to group
                                            </button>
                                        </>
                                    ) : null}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            <div className="mx-auto mt-5 flex w-full max-w-7xl flex-col gap-5 sm:mt-6">
                <KanbanBoard boardId={boardId} selectedAssigneeIds={selectedAssigneeIds} members={visibleMembers} />
            </div>

            <NewTaskDialog boardId={boardId} />
            <TaskDetailSheet boardId={boardId} />

            {canManageMembers ? (
                <Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add members to this board</DialogTitle>
                            <DialogDescription>
                                Enter one or more email addresses separated by commas, spaces, or new lines.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Input
                                value={inviteEmailsInput}
                                onChange={(event) => setInviteEmailsInput(event.target.value)}
                                placeholder="name@company.com, teammate@company.com"
                            />
                            <p className="text-xs text-muted-foreground">
                                {parsedInviteEmails.length} email{parsedInviteEmails.length === 1 ? '' : 's'} ready to invite
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setInviteEmailsInput('');
                                    setIsAddMembersOpen(false);
                                }}
                                disabled={addBoardMembers.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddMembers}
                                disabled={parsedInviteEmails.length === 0 || addBoardMembers.isPending}
                            >
                                {addBoardMembers.isPending ? 'Inviting...' : 'Invite members'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}
        </main>
    );
}
