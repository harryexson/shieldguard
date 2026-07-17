'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Users, CheckCircle, Activity, Clock, ShieldAlert, Scan, Bug, Wifi, FileWarning, Server, MonitorSmartphone } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { THREAT_EVENTS, timeAgo, formatDateShort } from '@/lib/data';
import { useAuth } from '@/lib/auth';

const severityColors: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500',
};

const severityBadge: Record<string, string> = {
  critical: 'destructive',
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

const statusColors: Record<string, string> = {
  blocked: 'text-green-400',
  mitigated: 'text-blue-400',
  detected: 'text-yellow-400',
  scanning: 'text-purple-400',
};

const typeIcons: Record<string, typeof Shield> = {
  'Pegasus Spyware': Bug,
  'Phishing URL': AlertTriangle,
  'Suspicious Domain': FileWarning,
  'IMSI Catcher': Wifi,
  'SMS Phishing': MonitorSmartphone,
  'Data Exfiltration Attempt': Server,
  'Malicious SMS': MonitorSmartphone,
  'Stalkerware': Bug,
};

const DEPARTMENTS = [
  { name: 'IT Security', devices: 32, protected: 30, atRisk: 2, lastScan: Date.now() - 3600000 },
  { name: 'Engineering', devices: 58, protected: 55, atRisk: 3, lastScan: Date.now() - 7200000 },
  { name: 'Marketing', devices: 24, protected: 22, atRisk: 2, lastScan: Date.now() - 14400000 },
  { name: 'Sales', devices: 18, protected: 18, atRisk: 0, lastScan: Date.now() - 3600000 },
  { name: 'HR', devices: 12, protected: 10, atRisk: 2, lastScan: Date.now() - 43200000 },
  { name: 'Finance', devices: 15, protected: 14, atRisk: 1, lastScan: Date.now() - 21600000 },
  { name: 'Operations', devices: 28, protected: 27, atRisk: 1, lastScan: Date.now() - 10800000 },
  { name: 'Executive', devices: 8, protected: 8, atRisk: 0, lastScan: Date.now() - 1800000 },
];

export default function EnterprisePage() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);

  const totalDevices = 863;
  const totalThreats = 5321;
  const activeUsers = 47;
  const coverageScore = 94;

  const handleOrgScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 3000);
  };

  return (
    <AppShell title="Enterprise Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 px-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <MonitorSmartphone className="size-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Devices</p>
                <p className="text-2xl font-bold text-gray-100">{totalDevices.toLocaleString()}</p>
                <p className="text-xs text-gray-500">across all organizations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 px-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
                <ShieldAlert className="size-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Threats Blocked</p>
                <p className="text-2xl font-bold text-gray-100">{totalThreats.toLocaleString()}</p>
                <p className="text-xs text-gray-500">lifetime blocked</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 px-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <Users className="size-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-100">{activeUsers}</p>
                <p className="text-xs text-gray-500">currently online</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 px-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="size-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Coverage Score</p>
                <p className="text-2xl font-bold text-gray-100">{coverageScore}%</p>
                <p className="text-xs text-gray-500">protection coverage</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Real-Time Threat Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4">
              {THREAT_EVENTS.slice(0, 6).map((event) => {
                const Icon = typeIcons[event.type] || AlertTriangle;
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 rounded-lg border-l-4 bg-gray-900/50 px-3 py-2.5 ${severityColors[event.severity]}`}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-gray-400" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-100">{event.type}</span>
                        <Badge variant={severityBadge[event.severity] as any} className="shrink-0 capitalize">{event.severity}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{event.deviceName}</span>
                        <span>·</span>
                        <span>{timeAgo(event.timestamp)}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-medium ${statusColors[event.status]}`}>{event.status}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center px-4 py-6">
              <div className="relative mb-4 flex size-36 items-center justify-center">
                <svg className="size-36 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgb(55,65,81)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54"
                    fill="none" stroke="rgb(52,211,153)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54 * coverageScore / 100} ${2 * Math.PI * 54 * (1 - coverageScore / 100)}`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-emerald-400">{coverageScore}</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 text-sm">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Devices Protected</span>
                  <span className="font-medium text-emerald-400">821 / 863</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Threats Mitigated</span>
                  <span className="font-medium text-emerald-400">95.2%</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Avg Response Time</span>
                  <span className="font-medium text-blue-400">1.2s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Devices</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Protected</TableHead>
                  <TableHead>At Risk</TableHead>
                  <TableHead>Last Scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEPARTMENTS.map((dept) => (
                  <TableRow key={dept.name}>
                    <TableCell className="font-medium text-gray-100">{dept.name}</TableCell>
                    <TableCell>{dept.devices}</TableCell>
                    <TableCell>
                      <span className="text-green-400">{dept.protected}</span>
                    </TableCell>
                    <TableCell>
                      <span className={dept.atRisk > 0 ? 'text-red-400' : 'text-gray-500'}>{dept.atRisk}</span>
                    </TableCell>
                    <TableCell className="text-gray-400">{timeAgo(dept.lastScan)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleOrgScan} disabled={scanning} size="lg">
            <Scan className={`size-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Run Org-Wide Scan'}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
