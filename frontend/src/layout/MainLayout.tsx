import { Outlet } from '@tanstack/react-router';
import { ChevronDown, LogOut } from 'lucide-react';
import {
    Avatar,
    AvatarFallback,
} from '@/components/ui/avatar';
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
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

function getInitials(name?: string, email?: string) {
    const source = name?.trim() || email?.trim() || 'U';
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length > 1) {
        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
}

export function MainLayout() {
    const user = useAuthStore((state) => state.user);
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/25">
            <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 flex-col">
                        <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                            Task Management
                        </span>
                        <span className="truncate text-sm font-semibold text-foreground/90 sm:text-base">
                            Workspace overview
                        </span>
                    </div>

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
            </header>

            <Outlet />
        </div>
    );
}
