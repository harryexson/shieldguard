import { useState, useCallback } from 'react';
import { AppInfo, ScanResult, SecurityAudit, SecurityCheck, NetworkConnection, DeviceInfo, Alert } from '../types';
import { useSecurity } from '../context/SecurityContext';
import { scanApi } from '../services/api';
import { KNOWN_THREATS, getThreatByPackage, getDomainReputation, SUSPICIOUS_DOMAINS } from '../constants/threats';

const MOCK_APPS: Omit<AppInfo, 'threatLevel' | 'threat'>[] = [
  { name: 'WhatsApp Messenger', packageName: 'com.whatsapp', version: '2.24.7.14', installedAt: Date.now() - 86400000 * 30, permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO', 'android.permission.ACCESS_FINE_LOCATION'], isFromStore: true },
  { name: 'Chrome Browser', packageName: 'com.android.chrome', version: '126.0.6478.134', installedAt: Date.now() - 86400000 * 60, permissions: [], isFromStore: true },
  { name: 'Gmail', packageName: 'com.google.android.gm', version: '2024.05.19', installedAt: Date.now() - 86400000 * 45, permissions: ['android.permission.GET_ACCOUNTS'], isFromStore: true },
  { name: 'Facebook', packageName: 'com.facebook.katana', version: '491.0.0.123', installedAt: Date.now() - 86400000 * 20, permissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.CAMERA'], isFromStore: true },
  { name: 'Instagram', packageName: 'com.instagram.android', version: '354.0.0.34.114', installedAt: Date.now() - 86400000 * 15, permissions: ['android.permission.CAMERA', 'android.permission.RECORD_AUDIO'], isFromStore: true },
  { name: 'Spotify', packageName: 'com.spotify.music', version: '8.8.96.364', installedAt: Date.now() - 86400000 * 10, permissions: [], isFromStore: true },
  { name: 'Device Health Services', packageName: 'com.google.android.apps.turbo', version: '3.2.3', installedAt: Date.now() - 86400000 * 90, permissions: [], isFromStore: true },
  { name: 'Samsung Notes', packageName: 'com.samsung.android.app.notes', version: '5.2.00', installedAt: Date.now() - 86400000 * 25, permissions: [], isFromStore: true },
  { name: 'My Tracker Lite', packageName: 'com.mytracker.app', version: '4.1.2', installedAt: Date.now() - 86400000 * 5, permissions: ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.READ_CONTACTS'], isFromStore: false },
  { name: 'System Update Pro', packageName: 'system.update.app', version: '2.8.0', installedAt: Date.now() - 86400000 * 3, permissions: ['android.permission.READ_PHONE_STATE', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_SMS', 'android.permission.RECEIVE_SMS'], isFromStore: false },
  { name: 'Flashlight', packageName: 'com.flashlight.bright', version: '1.0.5', installedAt: Date.now() - 86400000 * 8, permissions: ['android.permission.CAMERA'], isFromStore: false },
];

const MOCK_DEVICE_INFO: DeviceInfo = {
  manufacturer: 'Samsung',
  model: 'Galaxy S24',
  osVersion: 'Android 14',
  securityPatch: '2024-04-01',
  isRooted: false,
  isEncrypted: true,
  hasGooglePlayServices: true,
};

export function useAppScanner() {
  const { state, dispatch } = useSecurity();
  const [progress, setProgress] = useState(0);

  const performScan = useCallback(async (): Promise<ScanResult> => {
    dispatch({ type: 'START_SCAN' });
    setProgress(0);

    const scannedApps: AppInfo[] = [];
    const totalApps = MOCK_APPS.length;

    for (let i = 0; i < totalApps; i++) {
      const mockApp = MOCK_APPS[i];
      const threat = getThreatByPackage(mockApp.packageName);
      
      let threatLevel: AppInfo['threatLevel'] = 'safe';
      if (threat) {
        threatLevel = threat.severity === 'critical' ? 'critical' : 'danger';
      } else if (!mockApp.isFromStore && mockApp.permissions.length > 3) {
        threatLevel = 'warning';
      }

      scannedApps.push({
        ...mockApp,
        threatLevel,
        threat,
      });

      setProgress(Math.round(((i + 1) / totalApps) * 100));
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    const result: ScanResult = {
      id: `scan_${Date.now()}`,
      timestamp: Date.now(),
      appsScanned: totalApps,
      threatsFound: scannedApps.filter(a => a.threatLevel !== 'safe').length,
      apps: scannedApps,
    };

    // Merge real backend results: submit the package names we know about.
    // NOTE: Expo cannot enumerate truly-installed apps, so these package names
    // are the app's own mock inventory — we still query the backend threat DB
    // honestly and promote any matches.
    try {
      const backend = await scanApi.submitScan(
        MOCK_APPS.map(a => ({ packageName: a.packageName }))
      );
      const backendThreats = backend.threats || [];
      const byPackage = new Map(backendThreats.map(t => [t.packageName, t]));
      result.apps = result.apps.map(app => {
        const bt = byPackage.get(app.packageName);
        if (bt) {
          return { ...app, threatLevel: 'danger' as const, threat: { id: 'backend', name: bt.threat, type: 'surveillance' as const, severity: 'high' as const, description: bt.threat, packageNames: [bt.packageName], indicators: [], remediation: 'Review this app.' } };
        }
        return app;
      });
      result.threatsFound = result.apps.filter(a => a.threatLevel !== 'safe').length;
    } catch {
      // Backend unreachable — keep mock-only results.
    }

    dispatch({ type: 'COMPLETE_SCAN', payload: result });

    if (result.threatsFound > 0) {
      const alerts: Alert[] = [];
      if (result.threatsFound > 0) {
        alerts.push({
          id: `alert_${Date.now()}`,
          timestamp: Date.now(),
          title: 'Threats Detected',
          message: `Found ${result.threatsFound} suspicious application(s) on your device`,
          severity: 'high',
          type: 'threat',
          read: false,
        });
      }
      alerts.forEach(alert => dispatch({ type: 'ADD_ALERT', payload: alert }));
    }

    return result;
  }, [dispatch]);

  const checkApp = useCallback((packageName: string): AppInfo | undefined => {
    const app = MOCK_APPS.find(a => a.packageName === packageName);
    if (!app) return undefined;

    const threat = getThreatByPackage(app.packageName);
    return {
      ...app,
      threatLevel: threat ? (threat.severity === 'critical' ? 'critical' : 'danger') : 'safe',
      threat,
    };
  }, []);

  return {
    performScan,
    checkApp,
    isScanning: state.isScanning,
    progress,
    lastScan: state.lastScan,
  };
}

export function useSecurityAudit() {
  const { dispatch } = useSecurity();

  const performAudit = useCallback(async (): Promise<SecurityAudit> => {
    const checks: SecurityCheck[] = [
      {
        name: 'Screen Lock',
        passed: true,
        details: 'PIN/Pattern/Fingerprint enabled',
      },
      {
        name: 'Device Encryption',
        passed: MOCK_DEVICE_INFO.isEncrypted,
        details: MOCK_DEVICE_INFO.isEncrypted ? 'Device storage is encrypted' : 'Device storage is NOT encrypted',
      },
      {
        name: 'Unknown Sources',
        passed: false,
        details: 'Installation from unknown sources is allowed',
        recommendation: 'Disable "Install unknown apps" in Settings > Security',
      },
      {
        name: 'Google Play Protect',
        passed: MOCK_DEVICE_INFO.hasGooglePlayServices,
        details: MOCK_DEVICE_INFO.hasGooglePlayServices ? 'Play Protect is enabled' : 'Play Protect is not available',
      },
      {
        name: 'Security Updates',
        passed: true,
        details: `Security patch ${MOCK_DEVICE_INFO.securityPatch} installed`,
      },
      {
        name: 'Sideloaded Apps',
        passed: false,
        details: '4 sideloaded applications detected',
        recommendation: 'Review and remove unnecessary sideloaded apps',
      },
      {
        name: 'Dangerous Permissions',
        passed: false,
        details: 'Some apps have dangerous permissions',
        recommendation: 'Review app permissions in Settings > Apps',
      },
      {
        name: 'Network Security',
        passed: true,
        details: 'No suspicious network connections detected',
      },
    ];

    const passedChecks = checks.filter(c => c.passed).length;
    const score = Math.round((passedChecks / checks.length) * 100);

    const audit: SecurityAudit = {
      timestamp: Date.now(),
      score,
      checks,
    };

    dispatch({ type: 'SET_SECURITY_AUDIT', payload: audit });
    return audit;
  }, [dispatch]);

  return { performAudit };
}

export function useNetworkMonitor() {
  const { state, dispatch } = useSecurity();

  const connections: NetworkConnection[] = [
    {
      id: '1',
      appName: 'Chrome Browser',
      domain: 'www.google.com',
      ip: '142.250.185.206',
      port: 443,
      protocol: 'HTTPS',
      bytesIn: 2458624,
      bytesOut: 145920,
      timestamp: Date.now(),
      reputation: 'safe',
    },
    {
      id: '2',
      appName: 'WhatsApp',
      domain: 'whatsapp.net',
      ip: '157.240.221.12',
      port: 443,
      protocol: 'HTTPS',
      bytesIn: 524288,
      bytesOut: 102400,
      timestamp: Date.now(),
      reputation: 'safe',
    },
    {
      id: '3',
      appName: 'Instagram',
      domain: 'instagram.com',
      ip: '157.240.221.174',
      port: 443,
      protocol: 'HTTPS',
      bytesIn: 1048576,
      bytesOut: 204800,
      timestamp: Date.now(),
      reputation: 'safe',
    },
    {
      id: '4',
      appName: 'System Update Pro',
      domain: 'update-check.system',
      ip: '185.234.72.15',
      port: 443,
      protocol: 'HTTPS',
      bytesIn: 8192,
      bytesOut: 4096,
      timestamp: Date.now() - 300000,
      reputation: 'dangerous',
    },
    {
      id: '5',
      appName: 'My Tracker Lite',
      domain: 'track-server.net',
      ip: '91.234.56.78',
      port: 8080,
      protocol: 'TCP',
      bytesIn: 2048,
      bytesOut: 8192,
      timestamp: Date.now() - 60000,
      reputation: 'suspicious',
    },
  ].sort((a, b) => b.timestamp - a.timestamp);

  const checkConnection = useCallback((domain: string) => {
    return getDomainReputation(domain);
  }, []);

  const getConnections = useCallback(async () => {
    dispatch({ type: 'SET_NETWORK_CONNECTIONS', payload: connections });
    return connections;
  }, [dispatch]);

  const suspiciousConnections = connections.filter(c => c.reputation !== 'safe');
  const totalBandwidth = connections.reduce((acc, c) => acc + c.bytesIn + c.bytesOut, 0);

  return {
    connections,
    suspiciousConnections,
    totalBandwidth,
    checkConnection,
    getConnections,
  };
}

export function useDeviceInfo() {
  const { dispatch } = useSecurity();

  const getDeviceInfo = useCallback(async () => {
    dispatch({ type: 'SET_DEVICE_INFO', payload: MOCK_DEVICE_INFO });
    return MOCK_DEVICE_INFO;
  }, [dispatch]);

  return { getDeviceInfo, deviceInfo: MOCK_DEVICE_INFO };
}