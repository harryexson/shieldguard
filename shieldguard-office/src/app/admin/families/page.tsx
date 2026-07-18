'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, ServerOff, Inbox } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { officeApi, type FamilyGroup, type FamilyAdminResponse } from '@/lib/api';

function formatCreatedAt(value: string): string {
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(ts);
}

export default function AdminFamiliesPage() {
  const [data, setData] = useState<FamilyAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendDown, setBackendDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBackendDown(false);
    try {
      const res = await officeApi.getFamilies();
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load families';
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
    <AppShell title="Family Plans">
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <Users className="size-5 text-cyan-400" />
            Family Plans
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Lists all Family plan subscriptions ($19.99/mo, up to 5 devices) so support and admins can review device coverage and pending invites.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Family Subscriptions</span>
              {data && <Badge variant="outline">{data.count} total</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                Loading families…
              </div>
            ) : backendDown ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <ServerOff className="size-8 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Backend unavailable</p>
                  <p className="mt-1 text-xs text-gray-400">
                    The ShieldGuard backend is not running. Start it with <code className="rounded bg-gray-900 px-1 py-0.5 text-cyan-400">npm run dev</code> (default http://localhost:3000) to see live family subscriptions.
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
                  <p className="text-sm font-medium text-gray-200">Failed to load families</p>
                  <p className="mt-1 text-xs text-gray-400">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="size-3.5" />Retry
                </Button>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Inbox className="size-8 text-gray-500" />
                <p className="text-sm text-gray-400">No family subscriptions found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner device</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Pending invites</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium text-gray-100">{g.name}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">{g.ownerDeviceId}</TableCell>
                      <TableCell>
                        <Badge variant={g.deviceCount >= g.deviceLimit ? 'destructive' : 'secondary'}>
                          {g.deviceCount}/{g.deviceLimit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {g.pendingInvites > 0 ? (
                          <Badge variant="outline" className="text-amber-400">{g.pendingInvites}</Badge>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400">{formatCreatedAt(g.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loading && !error && !backendDown && data && (
              <div className="border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
                Showing {groups.length} of {data.count} family subscription{data.count === 1 ? '' : 's'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
