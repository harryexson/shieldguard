'use client';

import { useState, useMemo } from 'react';
import { SearchIcon, PlusIcon } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CUSTOMERS, formatCurrency, formatDate, timeAgo } from '@/lib/data';
import type { Customer } from '@/lib/data';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  trial: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  canceled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  past_due: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const planColors: Record<string, string> = {
  Basic: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  Pro: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Pro+': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  Enterprise: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Enterprise Plus': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const MOCK_NOTES: Record<string, string[]> = {
  c1: ['Spoke with John about SSO integration - requested demo', 'Quarterly review scheduled for next week'],
  c2: ['Reported false positive on internal tool', 'Asked about expanding to 150 devices'],
  c3: ['Upgraded from Basic last month', 'Asked about team plan pricing'],
  c4: ['Payment method expired - sent reminder', 'Considering Pro upgrade'],
  c5: ['Trial ends in 20 days', 'Very active during onboarding calls'],
  c6: ['CEO requested custom rule deployment', 'Scaling to 25 devices next quarter'],
  c7: ['Canceled due to budget constraints', 'Might return next fiscal year'],
  c8: ['VIP account - monthly business reviews', 'New 200-device department onboarding'],
};

const PLANS = ['Basic', 'Pro', 'Pro+', 'Enterprise', 'Enterprise Plus'];
const STATUSES = ['active', 'trial', 'canceled', 'past_due'] as const;

export default function CrmPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', plan: 'Basic', status: 'active' });

  const totalCustomers = CUSTOMERS.length;
  const activeSubscriptions = CUSTOMERS.filter((c) => c.status === 'active').length;
  const mrr = CUSTOMERS.reduce((sum, c) => sum + c.mrr, 0);
  const churned = CUSTOMERS.filter((c) => c.status === 'canceled').length;

  const filtered = useMemo(() => {
    return CUSTOMERS.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  function openDetail(c: Customer) {
    setSelectedCustomer(c);
    setDetailOpen(true);
  }

  function handleAdd() {
    setAddOpen(false);
    setForm({ name: '', email: '', company: '', plan: 'Basic', status: 'active' });
  }

  return (
    <AppShell title="Customer Relationship Management">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{totalCustomers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{activeSubscriptions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatCurrency(mrr)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Churned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{churned}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Customers</CardTitle>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger render={<Button><PlusIcon /> Add Customer</Button>} />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Customer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Select value={form.plan} onValueChange={(v) => v !== null && setForm({ ...form, plan: v })}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLANS.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => v !== null && setForm({ ...form, status: v })}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleAdd}>Add Customer</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-8"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MRR</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Threats</TableHead>
                  <TableHead>Last Scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => openDetail(c)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.company}</TableCell>
                    <TableCell>
                      <Badge className={planColors[c.plan as keyof typeof planColors] || ''}>
                        {c.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[c.status]}>
                        {c.status === 'past_due' ? 'Past Due' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(c.mrr)}</TableCell>
                    <TableCell>{c.devices}</TableCell>
                    <TableCell>{c.threats.toLocaleString()}</TableCell>
                    <TableCell>{c.lastScan ? timeAgo(c.lastScan) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="text-sm">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Company</p>
                  <p className="text-sm">{selectedCustomer.company}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Plan</p>
                  <Badge className={planColors[selectedCustomer.plan as keyof typeof planColors] || ''}>
                    {selectedCustomer.plan}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <Badge className={statusColors[selectedCustomer.status]}>
                    {selectedCustomer.status === 'past_due' ? 'Past Due' : selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">MRR</p>
                  <p className="text-sm">{formatCurrency(selectedCustomer.mrr)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Devices</p>
                  <p className="text-sm">{selectedCustomer.devices}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Threats Blocked</p>
                  <p className="text-sm">{selectedCustomer.threats.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Joined</p>
                  <p className="text-sm">{formatDate(selectedCustomer.joinedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Last Scan</p>
                  <p className="text-sm">{selectedCustomer.lastScan ? timeAgo(selectedCustomer.lastScan) : 'Never'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Recent Interactions</p>
                <div className="space-y-2">
                  {(MOCK_NOTES[selectedCustomer.id] ?? ['No recent interactions']).map((note, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{note}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
