'use client';

import { Shield, ShieldCheck, ShieldAlert, Users, ArrowRight, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ROLE_LABELS, ROLE_HIERARCHY, ROLE_PERMISSIONS, type Role } from '@/lib/rbac';
import { useAuth } from '@/lib/auth';

const hierarchyRoles: { role: Role; level: number; label: string; levelNum: number }[] = (Object.entries(ROLE_HIERARCHY) as [Role, number][])
  .sort(([, a], [, b]) => b - a)
  .map(([role, level], i) => ({ role, level, label: ROLE_LABELS[role], levelNum: i + 1 }));

const roleUserCounts: Record<Role, number> = {
  super_admin: 1,
  support_agent: 3,
  sales_rep: 2,
  marketing_manager: 1,
  accountant: 1,
  enterprise_admin: 2,
  enterprise_it_support: 1,
  enterprise_user: 5,
  individual_user: 2,
};

const roleDescriptions: Record<Role, string> = {
  super_admin: 'Full system access. Can manage users, roles, billing, and all platform settings. Unrestricted visibility into all data and operations.',
  support_agent: 'Customer-facing support role. Can view and respond to support tickets, manage customer accounts, and access customer-related data.',
  sales_rep: 'Manage leads, customers, and sales pipeline. Can create and update deals, access pitch decks, and manage customer relationships.',
  marketing_manager: 'Manage marketing campaigns, promotions, and analytics. Can create and monitor email, social, and discount campaigns.',
  accountant: 'Handle billing, invoices, transactions, and financial reports. Can manage subscriptions and access billing-related data.',
  enterprise_admin: 'Manage enterprise organization settings, users, and security policies. Can view threats, initiate scans, and access enterprise reports.',
  enterprise_it_support: 'Internal IT support for enterprise organizations. Can assist users with device security, scans, and troubleshooting.',
  enterprise_user: 'Standard enterprise user. Can view dashboard, threats, and perform personal device scans.',
  individual_user: 'Individual consumer user. Can view personal dashboard, threat alerts, and scan their own devices.',
};

const uniqueResources = [
  ...new Set(
    Object.values(ROLE_PERMISSIONS).flatMap(perms => perms.map(p => p.resource))
  ),
].sort();

const allActions = ['read', 'write', 'delete'];

export default function AdminRolesPage() {
  const { user } = useAuth();

  const getPermission = (role: Role, resource: string, action: string): boolean => {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) return false;
    return perms.some(p => (p.resource === '*' || p.resource === resource) && (p.action === '*' || p.action === action));
  };

  return (
    <AppShell title="Roles & Permissions">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Role Hierarchy</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="space-y-1">
                {hierarchyRoles.map((r, i) => (
                  <div key={r.role} className="relative">
                    <div className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-gray-900/50">
                      <div className="flex size-8 items-center justify-center rounded-full bg-gray-800">
                        {i === 0 ? (
                          <ShieldAlert className="size-4 text-red-400" />
                        ) : i === hierarchyRoles.length - 1 ? (
                          <Shield className="size-4 text-gray-400" />
                        ) : (
                          <ShieldCheck className="size-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-100">{r.label}</span>
                          <Badge variant="outline" className="text-xs">{r.level}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">Level {r.levelNum} · {roleUserCounts[r.role]} user{roleUserCounts[r.role] > 1 ? 's' : ''}</p>
                      </div>
                      {i < hierarchyRoles.length - 1 && (
                        <ChevronRight className="size-4 text-gray-600" />
                      )}
                    </div>
                    {i < hierarchyRoles.length - 1 && (
                      <div className="ml-7 border-l border-gray-800 pl-3">
                        <div className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div className="rounded-lg bg-gray-900/50 px-3 py-2.5">
                <p className="text-2xl font-bold text-gray-100">{Object.keys(ROLE_LABELS).length}</p>
                <p className="text-xs text-gray-400">Total Roles</p>
              </div>
              <div className="rounded-lg bg-gray-900/50 px-3 py-2.5">
                <p className="text-2xl font-bold text-gray-100">{Object.values(roleUserCounts).reduce((a, b) => a + b, 0)}</p>
                <p className="text-xs text-gray-400">Total Users</p>
              </div>
              <div className="rounded-lg bg-gray-900/50 px-3 py-2.5">
                <p className="text-2xl font-bold text-gray-100">{uniqueResources.length}</p>
                <p className="text-xs text-gray-400">Protected Resources</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <Tabs defaultValue="super_admin" className="w-full">
              <TabsList className="mb-4 flex-wrap">
                {hierarchyRoles.map((r) => (
                  <TabsTrigger key={r.role} value={r.role} className="text-xs">
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {hierarchyRoles.map((r) => (
                <TabsContent key={r.role} value={r.role} className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg bg-gray-900/50 px-4 py-3">
                    <Shield className="mt-0.5 size-5 shrink-0 text-blue-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-100">{r.label}</span>
                        <Badge variant="outline">Level {r.levelNum} · Hierarchy {r.level}</Badge>
                        <Badge>{roleUserCounts[r.role]} user{roleUserCounts[r.role] > 1 ? 's' : ''}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{roleDescriptions[r.role]}</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource</TableHead>
                        <TableHead className="text-center">Read</TableHead>
                        <TableHead className="text-center">Write</TableHead>
                        <TableHead className="text-center">Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueResources.map((resource) => {
                        const isWildcard = ROLE_PERMISSIONS[r.role].some(p => p.resource === '*');
                        const canRead = isWildcard || getPermission(r.role, resource, 'read');
                        const canWrite = isWildcard || getPermission(r.role, resource, 'write');
                        const canDelete = isWildcard || getPermission(r.role, resource, 'delete');
                        return (
                          <TableRow key={resource}>
                            <TableCell className="font-medium capitalize text-gray-100">{resource.replace(/_/g, ' ')}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox checked={canRead} disabled className={canRead ? 'text-green-400' : ''} />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox checked={canWrite} disabled className={canWrite ? 'text-green-400' : ''} />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox checked={canDelete} disabled className={canDelete ? 'text-green-400' : ''} />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
