'use client';

import { useState } from 'react';
import { TRANSACTIONS, INVOICES, SUBSCRIPTIONS, formatCurrency, formatDate } from '@/lib/data';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

const typeColors: Record<string, string> = {
  charge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  refund: 'bg-red-500/10 text-red-400 border-red-500/20',
  credit: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  payout: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const chartData = [
  { month: 'Jan', value: 45000 },
  { month: 'Feb', value: 52000 },
  { month: 'Mar', value: 48000 },
  { month: 'Apr', value: 61000 },
  { month: 'May', value: 58000 },
  { month: 'Jun', value: 67000 },
];
const maxVal = Math.max(...chartData.map(d => d.value));

export default function AccountingPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const totalRevenue = SUBSCRIPTIONS.filter(s => s.status === 'active').reduce((sum, s) => sum + s.mrr, 0);
  const monthlyCharges = TRANSACTIONS.filter(t => t.type === 'charge' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const refundsThisMonth = TRANSACTIONS.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0);
  const outstandingOverdue = INVOICES.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <AppShell title="Accounting">
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs tracking-wider uppercase text-gray-400">Total Revenue (MRR)</span>
              <span className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs tracking-wider uppercase text-gray-400">Monthly Charges</span>
              <span className="text-2xl font-bold">{formatCurrency(monthlyCharges)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs tracking-wider uppercase text-gray-400">Refunds (Month)</span>
              <span className="text-2xl font-bold text-red-400">{formatCurrency(refundsThisMonth)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1">
              <span className="text-xs tracking-wider uppercase text-gray-400">Outstanding Overdue</span>
              <span className="text-2xl font-bold text-yellow-400">{formatCurrency(outstandingOverdue)}</span>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => toast.success('Report generated successfully')}>Generate Report</Button>
          <Button variant="outline" onClick={() => toast.success('CSV exported successfully')}>Export CSV</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TRANSACTIONS.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-gray-400">{formatDate(tx.createdAt)}</TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell className="text-gray-400">{tx.customer}</TableCell>
                    <TableCell className={tx.type === 'refund' ? 'text-red-400' : ''}>
                      {tx.type === 'refund' ? `-${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeColors[tx.type]}>{tx.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[tx.status]}>{tx.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-3">
              {chartData.map(d => (
                <div key={d.month} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs text-gray-400">{formatCurrency(d.value)}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                    style={{ height: `${(d.value / maxVal) * 100}%` }}
                  />
                  <span className="mt-1 text-xs text-gray-500">{d.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">From</label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-44" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">To</label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-44" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
