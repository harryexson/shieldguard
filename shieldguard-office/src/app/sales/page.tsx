'use client';

import Link from 'next/link';
import { LEADS, formatCurrency, timeAgo } from '@/lib/data';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type StageConfig = { key: string; label: string; color: string };

const STAGES: StageConfig[] = [
  { key: 'new', label: 'New', color: 'bg-gray-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { key: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { key: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-red-500' },
  { key: 'won', label: 'Won', color: 'bg-green-500' },
  { key: 'lost', label: 'Lost', color: 'bg-gray-500' },
];

export default function SalesPage() {
  const wonLeads = LEADS.filter((l) => l.stage === 'won');
  const wonThisQtr = wonLeads.reduce((s, l) => s + l.value, 0);
  const totalPipeline = LEADS.reduce((s, l) => s + l.value, 0);
  const avgDeal = LEADS.length > 0 ? totalPipeline / LEADS.length : 0;
  const conversionRate = LEADS.length > 0 ? (wonLeads.length / LEADS.length) * 100 : 0;

  return (
    <AppShell title="Sales Pipeline">
      <div className="space-y-6">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STAGES.map((stage) => {
            const leads = LEADS.filter((l) => l.stage === stage.key);
            return (
              <div key={stage.key} className="min-w-[220px] flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm font-semibold text-gray-200">{stage.label}</span>
                  <Badge variant="secondary" className="ml-auto">{leads.length}</Badge>
                </div>
                <div className="space-y-2">
                  {leads.length === 0 && (
                    <div className="text-xs text-gray-600 text-center py-6 border border-dashed border-gray-800 rounded-lg">No deals</div>
                  )}
                  {leads.map((lead) => (
                    <Card key={lead.id} size="sm" className="cursor-pointer hover:ring-gray-500/30 transition-all">
                      <CardContent className="space-y-1.5">
                        <p className="font-medium text-sm text-gray-100">{lead.name}</p>
                        <p className="text-xs text-gray-400">{lead.company}</p>
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-gray-300 font-medium">{formatCurrency(lead.value)}</span>
                          <span className="text-gray-400">{lead.probability}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 pt-0.5">
                          <span>{lead.owner}</span>
                          <span>{timeAgo(lead.lastContact)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Total Pipeline Value</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(totalPipeline)}</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Won This Quarter</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-400">{formatCurrency(wonThisQtr)}</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Avg Deal Size</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(avgDeal)}</p></CardContent>
          </Card>
          <Card size="sm">
            <CardHeader><CardTitle className="text-xs text-gray-400">Conversion Rate</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{conversionRate.toFixed(0)}%</p></CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Link href="/sales/pitch-deck">
            <Button variant="outline" size="lg">📊 Sales Pitch Deck</Button>
          </Link>
          <Link href="/sales/investor-deck">
            <Button variant="outline" size="lg">📈 Investor Deck</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
