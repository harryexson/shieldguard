'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Scan, Search, Clock, HardDrive, Globe, AlertTriangle, Bug, Wifi, FileWarning, Server } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { officeApi } from '@/lib/api';

interface ScanResult {
  type: 'quick' | 'full';
  verdict: 'safe' | 'threats';
  filesScanned: number;
  appsChecked: number;
  connectionsAnalyzed: number;
  timeTaken: string;
  threats: { type: string; severity: string; location: string; recommendation: string }[];
}

const mockScanHistory = [
  { date: Date.now() - 86400000 * 1, type: 'Quick Scan', result: 'safe' as const, duration: '3.2s' },
  { date: Date.now() - 86400000 * 3, type: 'Full Deep Scan', result: 'threats' as const, duration: '8.7s' },
  { date: Date.now() - 86400000 * 7, type: 'Quick Scan', result: 'safe' as const, duration: '2.9s' },
];

export default function ScanPage() {
  const { user } = useAuth();
  const [quickScanning, setQuickScanning] = useState(false);
  const [fullScanning, setFullScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [animating, setAnimating] = useState(false);

  const isEnterprise = user?.role === 'enterprise_admin' || user?.role === 'enterprise_it_support' || user?.role === 'super_admin';

  const [backendThreats, setBackendThreats] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    officeApi
      .stats()
      .then((s) => {
        if (!active) return;
        setBackendThreats(s.totalThreats);
        setLive(true);
      })
      .catch(() => {
        if (active) setLive(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const runQuickScan = () => {
    setQuickScanning(true);
    setAnimating(true);
    setResult(null);
    setTimeout(() => {
      const foundThreats = Math.random() > 0.6;
      setResult({
        type: 'quick',
        verdict: foundThreats ? 'threats' : 'safe',
        filesScanned: 1247,
        appsChecked: 38,
        connectionsAnalyzed: 215,
        timeTaken: '3.2s',
        threats: foundThreats
          ? [
              { type: 'Suspicious Domain', severity: 'medium', location: 'System Cache', recommendation: 'Clear browser cache and review DNS settings.' },
            ]
          : [],
      });
      setQuickScanning(false);
      setAnimating(false);
    }, 3000);
  };

  const runFullScan = () => {
    setFullScanning(true);
    setAnimating(true);
    setResult(null);
    setTimeout(() => {
      const foundThreats = Math.random() > 0.3;
      setResult({
        type: 'full',
        verdict: foundThreats ? 'threats' : 'safe',
        filesScanned: 28473,
        appsChecked: 156,
        connectionsAnalyzed: 1842,
        timeTaken: '8.7s',
        threats: foundThreats
          ? [
              { type: 'Pegasus Spyware', severity: 'critical', location: '/System/Library/CoreServices', recommendation: 'Run full system restore and change all passwords.' },
              { type: 'Phishing URL', severity: 'high', location: 'Browser Bookmarks', recommendation: 'Remove suspicious bookmark and run browser security check.' },
            ].slice(0, Math.random() > 0.5 ? 2 : 1)
          : [],
      });
      setFullScanning(false);
      setAnimating(false);
    }, 5000);
  };

  const severityColors: Record<string, string> = { critical: 'destructive', high: 'default', medium: 'secondary', low: 'outline' };

  return (
    <AppShell title="Security Scan">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-blue-500/10">
            <Shield className="size-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Device Security Scan</h1>
          <p className="text-sm text-gray-400">Scan your device for threats, spyware, and vulnerabilities</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className={`transition-all ${quickScanning ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="flex flex-col items-center gap-4 px-4 py-6">
              <Search className="size-8 text-blue-400" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-100">Quick Scan</h3>
                <p className="text-xs text-gray-400">Scans critical system areas and running processes</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Clock className="size-3.5" />~3s</span>
                <span className="flex items-center gap-1"><HardDrive className="size-3.5" />1K+ files</span>
              </div>
              <Button onClick={runQuickScan} disabled={quickScanning || fullScanning} className="w-full">
                <Scan className={`size-4 ${quickScanning ? 'animate-spin' : ''}`} />
                {quickScanning ? 'Scanning...' : 'Start Quick Scan'}
              </Button>
            </CardContent>
          </Card>

          <Card className={`transition-all ${fullScanning ? 'ring-2 ring-purple-500' : ''}`}>
            <CardContent className="flex flex-col items-center gap-4 px-4 py-6">
              <Shield className="size-8 text-purple-400" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-100">Full Deep Scan</h3>
                <p className="text-xs text-gray-400">Comprehensive scan of all files, apps, and network</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Clock className="size-3.5" />~8s</span>
                <span className="flex items-center gap-1"><HardDrive className="size-3.5" />28K+ files</span>
              </div>
              <Button onClick={runFullScan} disabled={quickScanning || fullScanning} variant="secondary" className="w-full">
                <Shield className={`size-4 ${fullScanning ? 'animate-pulse' : ''}`} />
                {fullScanning ? 'Deep Scanning...' : 'Start Deep Scan'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {animating && (
          <Card>
            <CardContent className="flex items-center justify-center gap-3 px-4 py-8">
              <Scan className="size-6 animate-spin text-blue-400" />
              <span className="text-sm text-gray-300">Scanning device for threats...</span>
            </CardContent>
          </Card>
        )}

        {result && !animating && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scan Results</CardTitle>
                <Badge variant={result.verdict === 'safe' ? 'default' : 'destructive'} className="text-sm capitalize">
                  {result.verdict === 'safe' ? (
                    <span className="flex items-center gap-1"><ShieldCheck className="size-3.5" />Safe</span>
                  ) : (
                    <span className="flex items-center gap-1"><ShieldAlert className="size-3.5" />Threats Found</span>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-900/50 px-3 py-2.5 text-center">
                  <p className="text-2xl font-bold text-gray-100">{result.filesScanned.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Files Scanned</p>
                </div>
                <div className="rounded-lg bg-gray-900/50 px-3 py-2.5 text-center">
                  <p className="text-2xl font-bold text-gray-100">{result.appsChecked}</p>
                  <p className="text-xs text-gray-400">Apps Checked</p>
                </div>
                <div className="rounded-lg bg-gray-900/50 px-3 py-2.5 text-center">
                  <p className="text-2xl font-bold text-gray-100">{result.connectionsAnalyzed}</p>
                  <p className="text-xs text-gray-400">Network Connections</p>
                </div>
                <div className="rounded-lg bg-gray-900/50 px-3 py-2.5 text-center">
                  <p className="text-2xl font-bold text-gray-100">{result.timeTaken}</p>
                  <p className="text-xs text-gray-400">Time Taken</p>
                </div>
              </div>

              {result.threats.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-200">Threats Detected</h4>
                  {result.threats.map((threat, i) => (
                    <div key={i} className="rounded-lg border-l-4 border-l-red-500 bg-gray-900/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-red-400" />
                        <span className="font-medium text-gray-100">{threat.type}</span>
                        <Badge variant={(severityColors[threat.severity] || 'outline') as any}>{threat.severity}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">Location: {threat.location}</p>
                      <p className="mt-0.5 text-xs text-gray-400">Recommendation: {threat.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {result.verdict === 'safe' && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/5 px-4 py-3 text-sm text-green-400">
                  <ShieldCheck className="size-4" />
                  No threats detected. Your device appears to be secure.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="space-y-2">
              {mockScanHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-gray-900/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-full ${h.result === 'safe' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {h.result === 'safe' ? (
                        <ShieldCheck className="size-4 text-green-400" />
                      ) : (
                        <ShieldAlert className="size-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-100">{h.type}</p>
                      <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={h.result === 'safe' ? 'default' : 'destructive'} className="capitalize">{h.result}</Badge>
                    <span className="text-xs text-gray-400">{h.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isEnterprise && (
          <div className="flex justify-center">
            <Button variant="secondary" size="lg">
              <Globe className="size-4" />
              Scan All Organization Devices
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
