'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, RefreshCw, ServerOff, FlaskConical, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  officeApi,
  type IncidentsAdminResponse,
  type IncidentType,
  type ThreatPosture,
  type ThreatDashboardResponse,
} from '@/lib/api';

const TYPE_META: Record<IncidentType, { label: string }> = {
  panic: { label: 'Panic' },
  duress: { label: 'Duress' },
  sos: { label: 'SOS' },
};

interface PostureSignal {
  key: keyof ThreatPosture;
  label: string;
  why: string;
  action: string;
}

const POSTURE_SIGNALS: PostureSignal[] = [
  { key: 'rooted', label: 'Rooted / jailbroken', why: 'Privileged access can bypass OS protections and exfiltrate vault data.', action: 'Advise the user to use a non-rooted device for ShieldGuard.' },
  { key: 'developerMode', label: 'Developer mode', why: 'Enables debugging bridges that can intercept app memory and traffic.', action: 'Disable developer options when not actively developing.' },
  { key: 'vpnActive', label: 'VPN active', why: 'Encrypts traffic and hides network-level metadata from observers.', action: 'Keep a trusted VPN enabled on untrusted Wi-Fi.' },
  { key: 'screenLock', label: 'Screen lock', why: 'First line of defense if the device is lost or stolen.', action: 'Set a strong PIN or password on the lock screen.' },
  { key: 'biometrics', label: 'Biometrics', why: 'Adds a hardware-backed unlock factor for the vault.', action: 'Enroll fingerprint or face unlock for vault access.' },
  { key: 'osUpToDate', label: 'OS up to date', why: 'Security patches close known exploits used in targeted attacks.', action: 'Install the latest OS updates promptly.' },
  { key: 'appIntegrity', label: 'App integrity', why: 'Detects tampered or repackaged builds of the ShieldGuard app.', action: 'Install ShieldGuard only from the official app store.' },
];

export default function AdminThreatDashboardPage() {
  const [data, setData] = useState<IncidentsAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendDown, setBackendDown] = useState(false);

  const [demo, setDemo] = useState<ThreatDashboardResponse | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBackendDown(false);
    try {
      const res = await officeApi.getIncidentsAdmin();
      setData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load threat data';
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

  const runDemo = useCallback(async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const allTrue: ThreatPosture = {
        rooted: true,
        developerMode: true,
        vpnActive: false,
        screenLock: false,
        biometrics: false,
        osUpToDate: false,
        appIntegrity: true,
      };
      const res = await officeApi.scoreThreatDashboard(allTrue);
      setDemo(res);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Demo scoring failed');
    } finally {
      setDemoLoading(false);
    }
  }, []);

  const byType = data?.byType ?? { panic: 0, duress: 0, sos: 0 };

  return (
    <AppShell title="Threat Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-100">
            <ShieldAlert className="size-5 text-cyan-400" />
            Threat Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Aggregated, privacy-preserving signals from device incident markers, plus guidance on the on-device posture checks the mobile app performs.
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

        {backendDown ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <ServerOff className="size-8 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-200">Backend unavailable</p>
                <p className="mt-1 text-xs text-gray-400">
                  Start the ShieldGuard backend with <code className="rounded bg-gray-900 px-1 py-0.5 text-cyan-400">npm run dev</code> (default http://localhost:3000) to load incident aggregates.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="size-3.5" />Retry
              </Button>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <ServerOff className="size-8 text-red-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">Failed to load threat data</p>
                <p className="mt-1 text-xs text-gray-400">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="size-3.5" />Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-cyan-400" />
              Device Threat Posture Guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="px-4 pb-3 text-xs text-gray-400">
              These are the on-device signals the mobile app evaluates locally. ShieldGuard does not stream this data to the server, so the values below are guidance, not live device telemetry.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signal</TableHead>
                  <TableHead>Why it matters</TableHead>
                  <TableHead>Recommended user action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {POSTURE_SIGNALS.map((s) => (
                  <TableRow key={s.key}>
                    <TableCell className="font-medium text-gray-100">{s.label}</TableCell>
                    <TableCell className="text-gray-400">{s.why}</TableCell>
                    <TableCell className="text-gray-400">{s.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FlaskConical className="size-4 text-amber-400" />
                Test scoring endpoint
              </span>
              {demo && (
                <Badge variant="outline">
                  Score {demo.score} · {demo.riskLevel}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-400">
              Demo only: POSTs a sample posture (rooted + developer mode on, VPN / lock / biometrics / OS updates off) to <code className="rounded bg-gray-900 px-1 py-0.5 text-cyan-400">/api/threat-dashboard</code> to demonstrate the scoring endpoint. No real device data is involved.
            </p>
            <Button variant="outline" size="sm" onClick={runDemo} disabled={demoLoading}>
              <FlaskConical className="size-3.5" />
              {demoLoading ? 'Scoring…' : 'Run demo score'}
            </Button>
            {demoError && <p className="text-xs text-red-400">{demoError}</p>}
            {demo && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-xs text-gray-400">
                <div className="mb-1 text-gray-200">Checked at {demo.checkedAt}</div>
                <ul className="list-disc space-y-1 pl-4">
                  {demo.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
