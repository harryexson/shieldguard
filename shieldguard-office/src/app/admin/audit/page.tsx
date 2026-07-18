'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScrollText, RefreshCw, ServerOff, Inbox, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { officeApi, type AuditAdminResponse, type AuditEventAdmin } from '@/lib/api';

function formatAt(value: string): string {
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ts);
}

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendDown, setBackendDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBackendDown(false);
    try {
      const res = await officeApi.getAuditAdmin();
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit trail';
      setError(msg);
      if (
        err instanceof TypeError ||
        /Failed to fetch|NetworkError|load failed/i.test(msg)
      ) {
        setBackendDown(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byType = data?.byType ?? {};
  const recent: AuditEventAdmin[] = data?.recent ?? [];
  const total = data?.count ?? 0;
  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...typeEntries.map(([, c]) => c));

  return (
    <AppShell title="Audit Trail">
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <ScrollText className="size-5 text-cyan-400" />
            Audit Trail
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Aggregate administrative audit events. ShieldGuard stores only redacted event types — no content or PII.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-widest text-gray-500">Total events</div>
              <div className="mt-1 text-2xl font-semibold text-gray-100">
                {loading ? '—' : total}
              </div>
            </CardContent>
          </Card>
          {typeEntries.slice(0, 3).map(([type, count]) => (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-widest text-gray-500">{type}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-100">{count}</div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {typeEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Events by type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {typeEntries.map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 truncate text-xs text-gray-400">{type}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-10 shrink-0 text-right text-xs text-gray-300">{count}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent events</span>
              {data && <Badge variant="outline">{recent.length} shown</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Loading audit trail…
              </div>
            ) : backendDown ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <ServerOff className="size-8 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Backend unavailable</p>
                  <p className="mt-1 text-xs text-gray-400">
                    The ShieldGuard backend is not running. Start it with <code className="rounded bg-gray-900 px-1 py-0.5 text-cyan-400">npm run dev</code> (default http://localhost:3000) to see live audit events.
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
                  <p className="text-sm font-medium text-gray-200">Failed to load audit trail</p>
                  <p className="mt-1 text-xs text-gray-400">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="size-3.5" />Retry
                </Button>
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Inbox className="size-8 text-gray-500" />
                <p className="text-sm text-gray-400">No audit events recorded yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event type</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-cyan-400">{e.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">{e.deviceId}</TableCell>
                      <TableCell className="text-gray-400">{formatAt(e.at)}</TableCell>
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
            ShieldGuard stores only redacted event types (no content or PII). Device identifiers are masked before they reach the admin view.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
