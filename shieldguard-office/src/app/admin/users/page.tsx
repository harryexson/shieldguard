'use client';

import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, ShieldAlert, ShieldCheck, MoreHorizontal } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MOCK_USERS } from '@/lib/users';
import { useAuth } from '@/lib/auth';
import { ROLE_LABELS, type Role } from '@/lib/rbac';
import { timeAgo } from '@/lib/data';

const roleBadgeVariant: Record<string, string> = {
  super_admin: 'destructive',
  support_agent: 'default',
  sales_rep: 'secondary',
  marketing_manager: 'secondary',
  accountant: 'outline',
  enterprise_admin: 'default',
  enterprise_it_support: 'secondary',
  enterprise_user: 'outline',
  individual_user: 'ghost',
};

const statusBadgeVariant: Record<string, string> = {
  active: 'default',
  inactive: 'ghost',
  suspended: 'destructive',
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(MOCK_USERS);
  const [editUser, setEditUser] = useState<typeof MOCK_USERS[0] | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<Role>('individual_user');
  const [addOrg, setAddOrg] = useState('');

  const filtered = useMemo(
    () => users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  const handleSuspendToggle = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' as const : 'active' as const } : u));
  };

  const handleEditSave = () => {
    if (!editUser) return;
    setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u));
    setEditDialogOpen(false);
    setEditUser(null);
  };

  const handleAddUser = () => {
    const newUser = {
      id: `u${Date.now()}`,
      name: addName,
      email: addEmail,
      role: addRole,
      organization: addOrg || undefined,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      status: 'active' as const,
    };
    setUsers(prev => [...prev, newUser]);
    setAddName('');
    setAddEmail('');
    setAddRole('individual_user');
    setAddOrg('');
    setAddDialogOpen(false);
  };

  return (
    <AppShell title="User Administration">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger render={<Button><Plus className="size-4" />Add User</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="add-name">Name</Label>
                  <Input id="add-name" placeholder="Full name" value={addName} onChange={e => setAddName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input id="add-email" type="email" placeholder="email@example.com" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={addRole} onValueChange={(v) => v && setAddRole(v as Role)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-org">Organization</Label>
                  <Input id="add-org" placeholder="Organization name (optional)" value={addOrg} onChange={e => setAddOrg(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogTrigger render={<Button variant="outline">Cancel</Button>} />
                <Button onClick={handleAddUser}>Create User</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-gray-100">{u.name}</TableCell>
                    <TableCell className="text-gray-400">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={(roleBadgeVariant[u.role] || 'outline') as any}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{u.organization || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={(statusBadgeVariant[u.status] || 'ghost') as any} className="capitalize">
                        {u.status === 'active' ? (
                          <span className="flex items-center gap-1"><ShieldCheck className="size-3" />Active</span>
                        ) : u.status === 'suspended' ? (
                          <span className="flex items-center gap-1"><ShieldAlert className="size-3" />Suspended</span>
                        ) : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{timeAgo(u.lastLogin)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Dialog open={editDialogOpen && editUser?.id === u.id} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditUser(null); }}>
                          <DialogTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" onClick={() => setEditUser(u)}>
                                <Edit className="size-3.5" />
                              </Button>
                            }
                          />
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                            </DialogHeader>
                            {editUser && (
                              <div className="grid gap-4 py-2">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-name">Name</Label>
                                  <Input id="edit-name" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-email">Email</Label>
                                  <Input id="edit-email" type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Role</Label>
                                  <Select value={editUser.role} onValueChange={(v) => v && setEditUser({ ...editUser, role: v as Role })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                              <DialogTrigger render={<Button variant="outline">Cancel</Button>} />
                              <Button onClick={handleEditSave}>Save Changes</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleSuspendToggle(u.id)}>
                          {u.status === 'active' ? (
                            <ShieldAlert className="size-3.5 text-yellow-400" />
                          ) : (
                            <ShieldCheck className="size-3.5 text-green-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
              Showing {filtered.length} of {users.length} users
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
