'use client';

import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useAuth, MOCK_USERS } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/rbac';
import type { User } from '@/lib/rbac';

interface AppHeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function AppHeader({ title, onMenuClick }: AppHeaderProps) {
  const { user, impersonate, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-950 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-slate-200"
            onClick={onMenuClick}
          >
            <Menu className="size-4" />
          </Button>
        )}
        <h1 className="text-base font-semibold text-slate-200">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-200"
        >
          <Bell className="size-4" />
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center rounded-full outline-none data-open:ring-2 data-open:ring-cyan-500/50">
              <Avatar size="sm">
                <AvatarFallback className="bg-gray-800 text-xs text-slate-300 cursor-pointer">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-200">{user.name}</span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                  <span className="text-xs text-cyan-400">{ROLE_LABELS[user.role]}</span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-slate-200">
                  Impersonate
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuGroup>
                    {MOCK_USERS.filter((mu: User) => mu.id !== user.id).map((mu: User) => (
                      <DropdownMenuItem
                        key={mu.id}
                        className="text-slate-200"
                        onClick={() => impersonate(mu)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-[10px] font-medium text-slate-400">
                            {mu.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm">{mu.name}</span>
                            <span className="text-xs text-slate-500">{ROLE_LABELS[mu.role]}</span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-slate-200"
                onClick={() => logout()}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
