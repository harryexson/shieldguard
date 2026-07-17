'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { SIDEBAR_ITEMS, ROLE_LABELS } from '@/lib/rbac';
import { useAuth } from '@/lib/auth';
import { DEMO_QUICK_LOGINS } from '@/lib/users';
import { cn } from '@/lib/utils';
import { LogOut, X } from 'lucide-react';
import type { User } from '@/lib/rbac';

const SECTION_LABELS: Record<string, string> = {
  main: 'Main',
  operations: 'Operations',
  enterprise: 'Enterprise',
  admin: 'Admin',
};

interface AppSidebarProps {
  open?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ open, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, login, logout } = useAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const hasAccess = (roles: string[]) =>
    user && roles.includes(user.role);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-950 border-r border-gray-800 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
        open === false && '-translate-x-full',
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-gray-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 font-bold text-sm tracking-tight">
          SG
        </div>
        <span className="font-semibold text-slate-200 text-sm tracking-tight">
          ShieldGuard
        </span>
        {onToggle && (
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onToggle}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-1">
          {Object.entries(SIDEBAR_ITEMS).map(([section, items]) => {
            const visible = items.filter(i => hasAccess(i.roles));
            if (visible.length === 0) return null;
            return (
              <div key={section} className="mb-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  {SECTION_LABELS[section]}
                </div>
                {visible.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive(item.href)
                        ? 'bg-cyan-500/10 text-cyan-400 font-medium'
                        : 'text-slate-400 hover:bg-gray-800 hover:text-slate-200',
                    )}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-gray-800" />

      <div className="p-3 space-y-1">
        {user ? (
          <>
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-slate-300">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-200">{user.name}</div>
                <div className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-slate-400 hover:text-slate-200"
              onClick={() => logout()}
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </>
        ) : (
          <>
            <div className="px-1 pb-1 text-xs font-medium text-slate-500">Quick Login</div>
            {DEMO_QUICK_LOGINS.map((mu) => (
              <Button
                key={mu.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs text-slate-400 hover:text-slate-200"
                onClick={() => login(mu.email, mu.demoPassword)}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-[10px] font-medium text-slate-400">
                  {mu.name.charAt(0)}
                </div>
                <span className="truncate">{mu.name}</span>
              </Button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
