'use client';

import { useState } from 'react';
import { CAMPAIGNS, formatCurrency, formatDate, formatDateShort } from '@/lib/data';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PlusIcon } from 'lucide-react';

const typeColors: Record<string, string> = { email: 'bg-blue-500/10 text-blue-400 border-blue-500/20', social: 'bg-purple-500/10 text-purple-400 border-purple-500/20', discount: 'bg-green-500/10 text-green-400 border-green-500/20', referral: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
const statusColors: Record<string, string> = { active: 'bg-green-500/10 text-green-400 border-green-500/20', draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20', completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20', paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };

const fn = (n: number) => new Intl.NumberFormat('en-US').format(n);

export default function MarketingPage() {
  const [open, setOpen] = useState(false);
  const active = CAMPAIGNS.filter((c) => c.status === 'active');
  const totalSent = CAMPAIGNS.reduce((s, c) => s + c.sent, 0);
  const totalOpened = CAMPAIGNS.reduce((s, c) => s + c.opened, 0);
  const totalConverted = CAMPAIGNS.reduce((s, c) => s + c.converted, 0);
  const totalSpent = CAMPAIGNS.reduce((s, c) => s + c.spent, 0);
  const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

  return (
    <AppShell title="Marketing">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Active Campaigns</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{active.length}</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Total Sent</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{fn(totalSent)}</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Avg Open Rate</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{avgOpenRate.toFixed(1)}%</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Total Conversions</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{fn(totalConverted)}</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Budget Used</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Campaigns</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><PlusIcon /> New Campaign</Button>} />
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Campaign Name</Label>
                    <Input placeholder="e.g. Summer Sale" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Budget ($)</Label>
                    <Input type="number" placeholder="50000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Date</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Campaign goals, target audience..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={() => setOpen(false)}>Create Campaign</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CAMPAIGNS.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeColors[c.type]}>{c.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{fn(c.sent)}</TableCell>
                    <TableCell className="text-right">{fn(c.opened)}</TableCell>
                    <TableCell className="text-right">{c.sent > 0 ? ((c.converted / c.sent) * 100).toFixed(1) : '0.0'}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.budget)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.spent)}</TableCell>
                    <TableCell className="text-gray-400 text-xs">{formatDateShort(c.startDate)} - {formatDateShort(c.endDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPAIGNS.filter((c) => c.status !== 'draft').map((c) => {
            const spendPct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
            const openRate = c.sent > 0 ? (c.opened / c.sent) * 100 : 0;
            const convRate = c.sent > 0 ? (c.converted / c.sent) * 100 : 0;
            return (
              <Card key={c.id} size="sm">
                <CardHeader><CardTitle className="text-sm">{c.name}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Budget Used</span><span>{spendPct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(spendPct, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Open Rate</span><span>{openRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${Math.min(openRate, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Conversion</span><span>{convRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(convRate * 5, 100)}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
