'use client';

import { useState } from 'react';
import { INVOICES, SUBSCRIPTIONS, PROMOTIONS, PLAN_TIERS, formatCurrency, formatDate } from '@/lib/data';
import type { Subscription } from '@/lib/data';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  trial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  past_due: 'bg-red-500/10 text-red-400 border-red-500/20',
  canceled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  disabled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const planColors: Record<string, string> = {
  Basic: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
  Pro: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  'Pro+': 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  Enterprise: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'Enterprise Plus': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

const typeColors: Record<string, string> = {
  percentage: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  fixed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  trial_extension: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const statusOptions = ['active', 'trial', 'past_due', 'canceled'] as const;

export default function BillingPage() {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [promoDisabled, setPromoDisabled] = useState<Record<string, boolean>>({});
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('percentage');
  const [newValue, setNewValue] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  const activeCount = SUBSCRIPTIONS.filter(s => s.status === 'active').length;
  const mrrTotal = SUBSCRIPTIONS.reduce((sum, s) => sum + s.mrr, 0);
  const trialCount = SUBSCRIPTIONS.filter(s => s.status === 'trial').length;
  const pastDueCount = SUBSCRIPTIONS.filter(s => s.status === 'past_due').length;

  const filteredInvoices = INVOICES.filter(inv =>
    inv.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.customer.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.company.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  return (
    <AppShell title="Billing & Subscriptions">
      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-4 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-xs tracking-wider uppercase text-gray-400">Active</span>
                <span className="text-2xl font-bold text-emerald-400">{activeCount}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-xs tracking-wider uppercase text-gray-400">MRR</span>
                <span className="text-2xl font-bold">{formatCurrency(mrrTotal)}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-xs tracking-wider uppercase text-gray-400">Trials</span>
                <span className="text-2xl font-bold text-blue-400">{trialCount}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <span className="text-xs tracking-wider uppercase text-gray-400">Past Due</span>
                <span className="text-2xl font-bold text-red-400">{pastDueCount}</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SUBSCRIPTIONS.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.customer}</TableCell>
                      <TableCell className="text-gray-400">{sub.company}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={planColors[sub.plan]}>{sub.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[sub.status]}>{sub.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(sub.mrr)}</TableCell>
                      <TableCell>{sub.devices}</TableCell>
                      <TableCell className="text-gray-400">{formatDate(sub.nextBilling)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSub(sub);
                            setEditPlan(sub.plan);
                            setEditStatus(sub.status);
                            setEditDiscount('');
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-4">
          <Input
            placeholder="Search invoices..."
            value={invoiceSearch}
            onChange={e => setInvoiceSearch(e.target.value)}
            className="max-w-sm"
          />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                      <TableCell className="font-medium">{inv.customer}</TableCell>
                      <TableCell className="text-gray-400">{inv.company}</TableCell>
                      <TableCell>{formatCurrency(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[inv.status]}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{formatDate(inv.issuedAt)}</TableCell>
                      <TableCell className="text-gray-400">{inv.paidAt ? formatDate(inv.paidAt) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PLAN_TIERS.map(plan => (
              <Card key={plan.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    {plan.name.includes('Enterprise') ? (
                      <span className="text-xl font-bold text-amber-400">Contact Sales</span>
                    ) : (
                      <span className="text-2xl font-bold">
                        {formatCurrency(plan.price)}
                        <span className="text-sm font-normal text-gray-400">/mo</span>
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Devices</span>
                      <span>Up to {plan.devices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Support</span>
                      <span>{plan.support}</span>
                    </div>
                  </div>
                  <Separator />
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="mt-0.5 text-emerald-400">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="promotions" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Promotion Codes</h3>
            <Button onClick={() => setShowAddPromo(true)}>Add Promotion</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PROMOTIONS.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-medium">{p.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeColors[p.type]}>{p.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        {p.type === 'percentage' ? `${p.value}%` : p.type === 'fixed' ? formatCurrency(p.value) : `${p.value} days`}
                      </TableCell>
                      <TableCell>{p.usageCount}/{p.usageLimit}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[promoDisabled[p.id] ? 'disabled' : p.status]}>
                          {promoDisabled[p.id] ? 'disabled' : p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">{formatDate(p.startDate)} – {formatDate(p.endDate)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={!promoDisabled[p.id]}
                          onCheckedChange={checked => setPromoDisabled(prev => ({ ...prev, [p.id]: !checked }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editingSub !== null} onOpenChange={open => { if (!open) setEditingSub(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={v => setEditPlan(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TIERS.map(pt => (
                    <SelectItem key={pt.name} value={pt.name}>{pt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={v => setEditStatus(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Discount Amount ($)</Label>
              <Input type="number" value={editDiscount} onChange={e => setEditDiscount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingSub(null)}>Cancel</Button>
              <Button onClick={() => setEditingSub(null)}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPromo} onOpenChange={setShowAddPromo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="SUMMER50" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newType} onValueChange={v => setNewType(v ?? 'percentage')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="trial_extension">Trial Extension</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder={newType === 'percentage' ? '25' : newType === 'fixed' ? '500' : '30'}
              />
            </div>
            <div className="space-y-2">
              <Label>Usage Limit</Label>
              <Input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} placeholder="100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={newStart} onChange={e => setNewStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label>Enable immediately</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddPromo(false)}>Cancel</Button>
              <Button onClick={() => setShowAddPromo(false)}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
