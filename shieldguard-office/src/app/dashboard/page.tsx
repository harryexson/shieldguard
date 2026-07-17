'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/rbac';
import { CUSTOMERS, THREAT_EVENTS, formatCurrency, timeAgo } from '@/lib/data';
import { officeApi, type Stats } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  Shield,
  Scan,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

const OFFICE_ROLES = ['super_admin', 'support_agent', 'sales_rep', 'marketing_manager', 'accountant'] as const;
const ENTERPRISE_ROLES = ['enterprise_admin', 'enterprise_it_support', 'enterprise_user', 'individual_user'] as const;

function isOfficeRole(role: string) {
  return (OFFICE_ROLES as readonly string[]).includes(role);
}

function isEnterpriseRole(role: string) {
  return (ENTERPRISE_ROLES as readonly string[]).includes(role);
}

const severityColors: Record<string, string> = {
  critical: 'destructive',
  high: 'orange',
  medium: 'yellow',
  low: 'green',
} as const;

const statusColors: Record<string, string> = {
  blocked: 'default',
  mitigated: 'secondary',
  detected: 'destructive',
  scanning: 'outline',
} as const;

function OfficeKpiCards() {
  const totalRevenue = CUSTOMERS.reduce((sum, c) => sum + c.mrr, 0);
  const activeCustomers = CUSTOMERS.filter((c) => c.status === 'active').length;
  const totalDevices = CUSTOMERS.reduce((sum, c) => sum + c.devices, 0);
  const threatsToday = THREAT_EVENTS.filter(
    (t) => t.timestamp > Date.now() - 86400000,
  ).length;

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Active Customers', value: activeCustomers.toString(), icon: Users, color: 'text-blue-400' },
    { label: 'Devices Protected', value: totalDevices.toLocaleString(), icon: Shield, color: 'text-violet-400' },
    { label: 'Threats Blocked Today', value: threatsToday.toString(), icon: Activity, color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 ${kpi.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-400">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-100">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function OfficeQuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/support">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          View Support Tickets
        </Button>
      </Link>
      <Link href="/crm">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          View CRM
        </Button>
      </Link>
      <Link href="/billing">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          View Billing
        </Button>
      </Link>
    </div>
  );
}

function EnterpriseQuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/scan">
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <Scan className="mr-2 h-4 w-4" />
          Run Scan
        </Button>
      </Link>
    </div>
  );
}

function ThreatSeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { variant: string; label: string }> = {
    critical: { variant: 'destructive', label: 'Critical' },
    high: { variant: 'secondary', label: 'High' },
    medium: { variant: 'outline', label: 'Medium' },
    low: { variant: 'default', label: 'Low' },
  };
  const m = map[severity] || { variant: 'default', label: severity };
  return <Badge variant={m.variant as any}>{m.label}</Badge>;
}

function ThreatStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: string; label: string }> = {
    blocked: { variant: 'default', label: 'Blocked' },
    mitigated: { variant: 'secondary', label: 'Mitigated' },
    detected: { variant: 'destructive', label: 'Detected' },
    scanning: { variant: 'outline', label: 'Scanning' },
  };
  const m = map[status] || { variant: 'default', label: status };
  return <Badge variant={m.variant as any}>{m.label}</Badge>;
}

function CustomerStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'default',
    trial: 'secondary',
    canceled: 'destructive',
    past_due: 'outline',
  };
  return <Badge variant={(colors[status] || 'default') as any}>{status}</Badge>;
}

function RecentThreats() {
  const recent = [...THREAT_EVENTS]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Threat Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium text-gray-200">{t.type}</TableCell>
                <TableCell>
                  <ThreatSeverityBadge severity={t.severity} />
                </TableCell>
                <TableCell className="text-gray-400">{t.deviceName}</TableCell>
                <TableCell className="text-gray-400">{timeAgo(t.timestamp)}</TableCell>
                <TableCell>
                  <ThreatStatusBadge status={t.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentCustomers() {
  const customers = CUSTOMERS.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Customers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Threats</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-gray-200">{c.name}</TableCell>
                <TableCell className="text-gray-400">{c.company}</TableCell>
                <TableCell className="text-gray-300">{c.plan}</TableCell>
                <TableCell>
                  <CustomerStatusBadge status={c.status} />
                </TableCell>
                <TableCell className="text-gray-300">{formatCurrency(c.mrr)}</TableCell>
                <TableCell className="text-gray-400">{c.devices}</TableCell>
                <TableCell className="text-gray-400">{c.threats}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EnterpriseSecurityStats({ live }: { live?: Stats | null }) {
  const totalThreats = live ? live.totalThreats : THREAT_EVENTS.length;
  const blocked = live
    ? live.totalThreats - live.unreadAlerts
    : THREAT_EVENTS.filter((t) => t.status === 'blocked').length;
  const critical = live
    ? live.unreadAlerts
    : THREAT_EVENTS.filter((t) => t.severity === 'critical').length;
  const scanning = live
    ? live.scansPerformed
    : THREAT_EVENTS.filter((t) => t.status === 'scanning').length;

  const stats = [
    { label: 'Total Threats', value: totalThreats.toString(), icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Threats Blocked', value: blocked.toString(), icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Critical Alerts', value: critical.toString(), icon: XCircle, color: 'text-red-400' },
    { label: 'Active Scans', value: scanning.toString(), icon: RefreshCw, color: 'text-blue-400' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-100">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function LiveBanner({ live }: { live: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2">
      <span
        className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-400' : 'bg-amber-400'}`}
      />
      <span className="text-xs font-medium text-gray-300">
        Data source: <span className={live ? 'text-emerald-400' : 'text-amber-400'}>{live ? 'Live' : 'Demo'}</span>
        {!live && <span className="ml-1 text-gray-500">(backend unreachable — showing mock data)</span>}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    officeApi
      .stats()
      .then((s) => {
        if (!active) return;
        setStats(s);
        setLive(true);
      })
      .catch(() => {
        if (active) setLive(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!user) return null;

  const isOffice = isOfficeRole(user.role);
  const isEnterprise = isEnterpriseRole(user.role);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              Welcome back, {user.name}
            </h1>
            <p className="mt-1 text-sm text-gray-400">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        <LiveBanner live={live} />

        {isOffice && (
          <>
            <OfficeKpiCards />
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-200">Quick Actions</h2>
              <OfficeQuickActions />
            </div>
          </>
        )}

        {isEnterprise && (
          <>
            <EnterpriseSecurityStats live={stats} />
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-200">Quick Actions</h2>
              <EnterpriseQuickActions />
            </div>
          </>
        )}

        <RecentThreats />

        {isOffice && <RecentCustomers />}

        {isEnterprise && (
          <Card className="border-emerald-800/50 bg-emerald-900/10">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Shield className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-100">Run Security Scan</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Scan your devices for threats, spyware, and vulnerabilities
                </p>
              </div>
              <Link href="/scan">
                <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
                  <Scan className="mr-2 h-4 w-4" />
                  Start Scan
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
