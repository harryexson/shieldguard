'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bot, RefreshCw, ServerOff, Inbox, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { officeApi, type AiReport, type AiReportsAdminResponse } from '@/lib/api';

const RISK_ORDER = ['low', 'medium', 'high', 'critical'] as const;
type RiskLevel = (typeof RISK_ORDER)[number];

function riskBadge(risk: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (risk.toLowerCase()) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
}

function formatGeneratedAt(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const ts = value < 1e12 ? value * 1000 : value;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

export default function AdminAiReportsPage() {
  const [data, setData] = useState<AiReportsAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendDown, setBackendDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBackendDown(false);
    try {
      const res = await officeApi.getAiReportsAdmin();
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load AI reports';
      setError(msg);
      if (err instanceof TypeError || /Failed to fetch|NetworkError|load failed/i.test(msg)) {
        setBackendDown(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byRisk = data?.byRisk ?? { low: 0, medium: 0, high: 0, critical: 0 };
  const recent = data?.recent ?? [];
  const total = data?.count ?? 0;
  const maxRisk = Math.max(1, ...RISK_ORDER.map((r) => byRisk[r]));

  return (
    <AppShell title="AI Reports">
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <Bot className="size-5 text-cyan-400" />
            AI Reports
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Aggregate view of AI-generated security summaries produced by user devices. Server-side storage is limited to a redacted risk level and short preview — no raw events or PII.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-widest text-gray-500">Total reports</div>
              <div className="mt-1 text-2xl font-semibold text-gray-100">
                {loading ? '—' : total}
              </div>
            </CardContent>
          </Card>
          {RISK_ORDER.map((r) => (
            <Card key={r}>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-widest text-gray-500">{r}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-100">{byRisk[r]}</div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${(byRisk[r] / maxRisk) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent reports</span>
              {data && <Badge variant="outline">{recent.length} shown</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Loading AI reports…
              </div>
            ) : backendDown ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <ServerOff className="size-8 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Backend unavailable</p>
                  <p className="mt-1 text-xs text-gray-400">
                    The ShieldGuard backend is not running. Start it with <code className="rounded bg-gray-900 px-1 py-0.5 text-cyan-400">npm run dev</code> (default http://localhost:3000) to see live AI reports.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="size-3.5" />Retry
                </Button>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <ServerOff className="size-8 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Failed to load AI reports</p>
                  <p className="mt-1 text-xs text-gray-400">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="size-3.5" />Retry
                </Button>
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Inbox className="size-8 text-gray-500" />
                <p className="text-sm text-gray-400">No AI reports recorded yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Generated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r: AiReport) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-gray-400">{r.deviceId}</TableCell>
                      <TableCell>
                        <Badge variant={riskBadge(r.riskLevel)}>{r.riskLevel}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-gray-400">{r.preview}</TableCell>
                      <TableCell className="text-gray-400">{formatGeneratedAt(r.generatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3 text-xs text-gray-400">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-400" />
          <p>
            ShieldGuard stores only a redacted AI summary (risk level + preview). The underlying security events and any PII are never persisted by the server.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
