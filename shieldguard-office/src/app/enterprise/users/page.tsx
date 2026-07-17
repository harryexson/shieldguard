'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Send, Clock, CheckCircle, HelpCircle, Shield, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ENTERPRISE_USERS, timeAgo } from '@/lib/data';
import { ROLE_LABELS } from '@/lib/rbac';
import { useAuth } from '@/lib/auth';

const roleBadgeColors: Record<string, string> = {
  enterprise_admin: 'default',
  enterprise_it_support: 'secondary',
  enterprise_user: 'outline',
};

const mockInvites = [
  { email: 'diana@acmecorp.com', invitedBy: 'John Smith', date: Date.now() - 86400000 * 2, status: 'pending' as const },
  { email: 'frank@acmecorp.com', invitedBy: 'John Smith', date: Date.now() - 86400000 * 5, status: 'accepted' as const },
  { email: 'grace@acmecorp.com', invitedBy: 'Alice Wong', date: Date.now() - 86400000 * 7, status: 'pending' as const },
];

export default function EnterpriseUsersPage() {
  const { user } = useAuth();
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('enterprise_user');
  const [inviteDept, setInviteDept] = useState('');
  const [invites, setInvites] = useState(mockInvites);

  const itSupportUsers = ENTERPRISE_USERS.filter(u => u.role === 'enterprise_it_support');

  const handleInvite = () => {
    setInvites(prev => [
      { email: inviteEmail, invitedBy: user?.name || 'Unknown', date: Date.now(), status: 'pending' as const },
      ...prev,
    ]);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('enterprise_user');
    setInviteDept('');
  };

  return (
    <AppShell title="Team Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Enterprise Users</h2>
            <p className="text-sm text-gray-400">Manage your organization&apos;s team members and their roles</p>
          </div>
          <Dialog>
            <DialogTrigger render={<Button><Plus className="size-4" />Invite User</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="invite-name">Name</Label>
                  <Input id="invite-name" placeholder="Full name" value={inviteName} onChange={e => setInviteName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input id="invite-email" type="email" placeholder="email@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enterprise_admin">Enterprise Admin</SelectItem>
                      <SelectItem value="enterprise_it_support">Enterprise IT Support</SelectItem>
                      <SelectItem value="enterprise_user">Enterprise User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="invite-dept">Department</Label>
                  <Input id="invite-dept" placeholder="Department name" value={inviteDept} onChange={e => setInviteDept(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogTrigger render={<Button variant="outline">Cancel</Button>} />
                <Button onClick={handleInvite}><Send className="size-4" />Send Invite</Button>
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
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ENTERPRISE_USERS.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-gray-100">{u.name}</TableCell>
                    <TableCell className="text-gray-400">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={(roleBadgeColors[u.role] || 'outline') as any}>
                        {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">{u.department}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'active' ? 'default' : 'ghost'}>
                        {u.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">{timeAgo(u.lastActive)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm"><Edit className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm"><Trash2 className="size-3.5 text-red-400" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            {invites.map((inv, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-900/50 px-3 py-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-gray-800">
                  {inv.status === 'accepted' ? (
                    <CheckCircle className="size-4 text-green-400" />
                  ) : (
                    <Clock className="size-4 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-100">{inv.email}</p>
                  <p className="text-xs text-gray-400">Invited by {inv.invitedBy} · {timeAgo(inv.date)}</p>
                </div>
                <Badge variant={inv.status === 'accepted' ? 'default' : 'secondary'}>
                  {inv.status === 'accepted' ? 'Accepted' : 'Pending'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IT Support Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <div className="flex items-start gap-3 rounded-lg bg-blue-500/5 border border-blue-500/10 px-4 py-3">
              <HelpCircle className="mt-0.5 size-5 shrink-0 text-blue-400" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-gray-100 mb-1">Internal Support Capability</p>
                <p>Enterprise IT Support users can assist non-tech-savvy staff with device security, scan initiation, threat remediation, and general troubleshooting — all without needing full admin access.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {itSupportUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg bg-gray-900/50 px-4 py-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
                    <Shield className="size-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-100">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email} · {u.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
