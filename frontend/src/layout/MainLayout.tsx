import { Outlet, useMatchRoute } from '@tanstack/react-router';
import { Bell, Check, ChevronDown, LogOut, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Avatar,
    AvatarFallback,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
    useAcceptInvite,
    useDeclineInvite,
    useMarkNotificationRead,
    useNotifications,
} from '@/modules/notifications';
import { cn } from '@/lib/utils';
import { useAuthStore, useBoardUIStore } from '@/store';

function getInitials(name?: string, email?: string) {
    const source = name?.trim() || email?.trim() || 'U';
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length > 1) {
        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
}

export function MainLayout() {
    const matchRoute = useMatchRoute();
    const user = useAuthStore((state) => state.user);
    const openCreateBoardDialog = useBoardUIStore((state) => state.openCreateDialog);
    const { logout } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications();
    const markRead = useMarkNotificationRead();
    const acceptInvite = useAcceptInvite();
    const declineInvite = useDeclineInvite();

    const notifications = useMemo(
        () => notificationsData?.notifications ?? [],
        [notificationsData?.notifications],
    );
    const unreadCount = notificationsData?.unreadCount ?? 0;
    const isBoardsListRoute = Boolean(matchRoute({ to: '/boards' }));

    const activeInviteIds = useMemo(() => {
        const pending = new Set<string>();

        for (const notification of notifications) {
            if (notification.type === 'board_invite' && !notification.isRead && notification.boardMemberId) {
                pending.add(notification.boardMemberId);
            }
        }

        return pending;
    }, [notifications]);

    const handleMarkRead = async (notificationId: string) => {
        await markRead.mutateAsync(notificationId);
    };

    const handleAccept = async (notificationId: string, inviteId: string) => {
        await acceptInvite.mutateAsync(inviteId);
        await markRead.mutateAsync(notificationId);
    };

    const handleDecline = async (notificationId: string, inviteId: string) => {
        await declineInvite.mutateAsync(inviteId);
        await markRead.mutateAsync(notificationId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/25">
            <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
                <div className="px-4 sm:px-6">
                    <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 py-3">
                        <div className="flex min-w-0 flex-col">
                            <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                                Task Management
                            </span>
                            <span className="truncate text-sm font-semibold text-foreground/90 sm:text-base">
                                Workspace overview
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {isBoardsListRoute ? (
                                <Button type="button" onClick={openCreateBoardDialog} className="hidden lg:inline-flex">
                                    <Plus className="size-4" />
                                    New Board
                                </Button>
                            ) : null}

                            <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                                <DropdownMenuTrigger
                                    className={cn(
                                        'relative inline-flex size-9 items-center justify-center rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                                    )}
                                    aria-label="Open notifications"
                                >
                                    <Bell className="size-4" />
                                    {unreadCount > 0 ? (
                                        <span className="absolute -top-1 -right-1 rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    ) : null}
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-[24rem] min-w-[24rem] max-w-[calc(100vw-2rem)] p-0"
                                >
                                    <div className="border-b px-4 py-3">
                                        <p className="text-sm font-semibold text-foreground">Notifications</p>
                                        <p className="text-xs text-muted-foreground">
                                            Invitations and updates related to your boards.
                                        </p>
                                    </div>

                                    <div className="max-h-[24rem] space-y-3 overflow-y-auto p-3">
                                        {isLoadingNotifications ? (
                                            <p className="text-sm text-muted-foreground">Loading notifications...</p>
                                        ) : notifications.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No notifications yet.</p>
                                        ) : (
                                            notifications.map((notification) => {
                                                const hasPendingInvite =
                                                    notification.type === 'board_invite' &&
                                                    !notification.isRead &&
                                                    notification.boardMemberId &&
                                                    activeInviteIds.has(notification.boardMemberId);

                                                return (
                                                    <div
                                                        key={notification.id}
                                                        className={cn(
                                                            'rounded-lg border p-3',
                                                            notification.isRead ? 'bg-background' : 'bg-muted/40',
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold">{notification.title}</p>
                                                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    {new Date(notification.createdAt).toLocaleString()}
                                                                </p>
                                                            </div>

                                                            {!notification.isRead ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleMarkRead(notification.id)}
                                                                >
                                                                    Mark read
                                                                </Button>
                                                            ) : null}
                                                        </div>

                                                        {hasPendingInvite ? (
                                                            <div className="mt-3 flex items-center gap-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() => handleAccept(notification.id, notification.boardMemberId!)}
                                                                    disabled={acceptInvite.isPending || declineInvite.isPending}
                                                                >
                                                                    <Check className="size-4" />
                                                                    Accept
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleDecline(notification.id, notification.boardMemberId!)}
                                                                    disabled={acceptInvite.isPending || declineInvite.isPending}
                                                                >
                                                                    <X className="size-4" />
                                                                    Decline
                                                                </Button>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className={cn(
                                        'flex items-center gap-3 rounded-full border border-border/70 bg-card px-2 py-1.5 text-left shadow-sm transition-colors outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50',
                                        'data-[popup-open]:bg-muted data-[popup-open]:ring-2 data-[popup-open]:ring-ring/40',
                                    )}
                                >
                                    <Avatar size="default" className="bg-muted">
                                        <AvatarFallback>{getInitials(user?.name, user?.email)}</AvatarFallback>
                                    </Avatar>

                                    <div className="hidden min-w-0 sm:block">
                                        <p className="truncate text-sm font-medium leading-none">
                                            {user?.name || 'Profile'}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {user?.email || 'Signed in'}
                                        </p>
                                    </div>

                                    <ChevronDown className="size-4 text-muted-foreground" />
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="min-w-56">
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-2">
                                            <span className="text-sm font-semibold text-foreground">
                                                {user?.name || 'User'}
                                            </span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {user?.email}
                                            </span>
                                        </DropdownMenuLabel>
                                    </DropdownMenuGroup>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        variant="destructive"
                                        disabled={logout.isPending}
                                        onClick={() => logout.mutate()}
                                    >
                                        <LogOut className="size-4" />
                                        {logout.isPending ? 'Logging out...' : 'Logout'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {isBoardsListRoute ? (
                <Button
                    type="button"
                    size="icon-lg"
                    onClick={openCreateBoardDialog}
                    className="fixed right-4 bottom-4 z-50 rounded-full shadow-lg lg:hidden"
                    aria-label="Create new board"
                >
                    <Plus className="size-5" />
                </Button>
            ) : null}

            <Outlet />
        </div>
    );
}
