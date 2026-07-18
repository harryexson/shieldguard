'use client';

import { useState, useEffect, useCallback } from 'react';
import { Siren, RefreshCw, ServerOff, Inbox, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { officeApi, type IncidentsAdminResponse, type IncidentType } from '@/lib/api';

function formatCreatedAt(value: string): string {
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ts);
}

const TYPE_META: Record<IncidentType, { label: string; badge: 'destructive' | 'secondary' | 'outline' }> = {
  panic: { label: 'Panic', badge: 'destructive' },
  duress: { label: 'Duress', badge: 'secondary' },
  sos: { label: 'SOS', badge: 'outline' },
};

function statusBadge(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status.toLowerCase();
  if (s === 'resolved' || s === 'handled') return 'secondary';
  if (s === 'active' || s === 'open') return 'destructive';
  return 'outline';
}

export default function AdminIncidentsPage() {
  const [data, setData] = useState<IncidentsAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendDown, setBackendDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBackendDown(false);
    try {
      const res = await officeApi.getIncidentsAdmin();
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load incidents';
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

  const byType = data?.byType ?? { panic: 0, duress: 0, sos: 0 };
  const recent = data?.recent ?? [];

  return (
    <AppShell title="Incident Logs">
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <Siren className="size-5 text-cyan-400" />
            Incident Logs
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Aggregate, privacy-preserving incident markers raised by user devices (panic / duress / SOS). Protects operations from abuse without exposing vault contents.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-widest text-gray-500">Total incidents</div>
              <div className="mt-1 text-2xl font-semibold text-gray-100">
                {loading ? '—' : (data?.count ?? 0)}
              </div>
            </CardContent>
          </Card>
          {(['panic', 'duress', 'sos'] as IncidentType[]).map((t) => (
            <Card key={t}>
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-widest text-gray-500">{TYPE_META[t].label}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-100">{byType[t]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent incidents</span>
              {data && <Badge variant="outline">{recent.length} shown</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Loading incidents…
              </div>
            ) : backendDown ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <ServerOff className="size-8 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Backend unavailable</p>
                  <p className="mt-1 text-xs text-gray-400">
                    The ShieldGuard backend is not running. Start it with <code className="rounded bg-gray-900 px-1 py-0.5 text-cyan-400">npm run dev</code> (default http://localhost:3000) to see live incident logs.
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
                  <p className="text-sm font-medium text-gray-200">Failed to load incidents</p>
                  <p className="mt-1 text-xs text-gray-400">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="size-3.5" />Retry
                </Button>
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Inbox className="size-8 text-gray-500" />
                <p className="text-sm text-gray-400">No incidents recorded yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-gray-400">{r.deviceId}</TableCell>
                      <TableCell>
                        <Badge variant={TYPE_META[r.type]?.badge ?? 'outline'}>
                          {TYPE_META[r.type]?.label ?? r.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{formatCreatedAt(r.createdAt)}</TableCell>
                      <TableCell className="max-w-xs truncate text-gray-400">{r.note ?? '—'}</TableCell>
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
            These are privacy-preserving incident markers created by user devices (panic / duress / SOS). ShieldGuard cannot read the contents of a user&apos;s vault.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
