'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, ServerOff, Inbox, ShieldAlert, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { officeApi, type FamilyGroup, type FamilyAdminResponse, type FamilyMemberDevice } from '@/lib/api';

function formatCreatedAt(value: string): string {
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(ts);
}

type WipeState = 'idle' | 'confirm' | 'sending' | 'done' | 'error';

function DeviceWipeButton({ device }: { device: FamilyMemberDevice }) {
  const [state, setState] = useState<WipeState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    setState('sending');
    setMessage(null);
    try {
      await officeApi.adminDeviceCommand(device.deviceId, 'wipe');
      setState('done');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to send wipe command');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="size-3.5" />Command queued
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-400">
        <XCircle className="size-3.5" />{message ?? 'Failed'}
      </span>
    );
  }

  if (state === 'confirm') {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="destructive" size="sm" onClick={send}>
          <Trash2 className="size-3.5" />Confirm wipe
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setState('idle')}>Cancel</Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" size="sm" onClick={() => setState('confirm')}>
      <Trash2 className="size-3.5" />Remote Wipe
    </Button>
  );
}

export default function AdminTeamsPage() {
  const [data, setData] = useState<FamilyAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendDown, setBackendDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBackendDown(false);
    try {
      const res = await officeApi.getFamiliesAdmin();
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load teams';
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

  const groups: FamilyGroup[] = data?.groups ?? [];

  return (
    <AppShell title="Teams">
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <Users className="size-5 text-cyan-400" />
            Teams
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Family groups and their member devices. Admins can issue a best-effort remote wipe to any enrolled device.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Teams</span>
              {data && <Badge variant="outline">{data.count} total</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Loading teams…
              </div>
            ) : backendDown ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <ServerOff className="size-8 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Backend unavailable</p>
                  <p className="mt-1 text-xs text-gray-400">
                    The ShieldGuard backend is not running. Start it with <code className="rounded bg-gray-900 px-1 py-0.5 text-cyan-400">npm run dev</code> (default http://localhost:3000) to see live teams.
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
                  <p className="text-sm font-medium text-gray-200">Failed to load teams</p>
                  <p className="mt-1 text-xs text-gray-400">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="size-3.5" />Retry
                </Button>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Inbox className="size-8 text-gray-500" />
                <p className="text-sm text-gray-400">No teams found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {groups.map((g) => {
                  const members = g.devices ?? [];
                  return (
                    <div key={g.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-medium text-gray-100">{g.name}</span>
                        <Badge variant={g.deviceCount >= g.deviceLimit ? 'destructive' : 'secondary'}>
                          {g.deviceCount}/{g.deviceLimit} devices
                        </Badge>
                        {g.pendingInvites > 0 && (
                          <Badge variant="outline" className="text-amber-400">{g.pendingInvites} pending</Badge>
                        )}
                        <span className="text-xs text-gray-500">created {formatCreatedAt(g.createdAt)}</span>
                      </div>

                      {members.length === 0 ? (
                        <p className="mt-2 text-xs text-gray-500">
                          Member device list unavailable from this endpoint (group summary only). Owner device:{' '}
                          <span className="font-mono text-gray-400">{g.ownerDeviceId}</span>.
                        </p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Device</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {members.map((m) => (
                                <TableRow key={m.deviceId}>
                                  <TableCell className="font-mono text-xs text-gray-400">{m.deviceId}</TableCell>
                                  <TableCell className="text-gray-300">{m.name ?? '—'}</TableCell>
                                  <TableCell>
                                    {m.isOwner ? (
                                      <Badge variant="outline" className="text-cyan-400">Owner</Badge>
                                    ) : (
                                      <span className="text-gray-500">Member</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DeviceWipeButton device={m} />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {!loading && !error && !backendDown && data && (
              <div className="border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
                Showing {groups.length} of {data.count} team{data.count === 1 ? '' : 's'}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-xs text-amber-300">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Remote wipe is best-effort: it requires the target device to be online with the ShieldGuard app open. The command is queued but delivery is not guaranteed.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
