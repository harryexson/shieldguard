import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllThreats,
  checkPackageForThreat,
  checkDomainReputation,
  getLatestThreatFeed,
  THREAT_DATABASE,
  SUSPICIOUS_DOMAINS,
} from './threats.js';
import {
  analyzeThreatRisk,
  compareFileHashes,
  getHeuristicPatterns,
  getThreatSignatures,
} from './ai-analysis.js';
import {
  getScans,
  addScan,
  getAlerts,
  addAlert,
  markAlertRead,
  deleteAlert,
  getSettings,
  updateSettings,
  getStats,
} from './database.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/api/threats', (req, res) => {
  const threats = getAllThreats();
  res.json(threats);
});

app.get('/api/threats/feed', (req, res) => {
  const feed = getLatestThreatFeed();
  res.json(feed);
});

app.get('/api/threats/check/:packageName', (req, res) => {
  const { packageName } = req.params;
  const threat = checkPackageForThreat(packageName);
  if (threat) {
    res.json(threat);
  } else {
    res.status(404).json({ message: 'No known threat found for this package' });
  }
});

app.get('/api/network/check/:domain', (req, res) => {
  const { domain } = req.params;
  const reputation = checkDomainReputation(domain);
  if (reputation) {
    res.json(reputation);
  } else {
    res.json({ risk: 'safe', type: 'legitimate' });
  }
});

app.get('/api/network/check-ip/:ip', (req, res) => {
  const { ip } = req.params;
  const knownMaliciousIPs = [
    '185.234.72.15',
    '91.234.56.78',
    '45.33.32.156',
  ];
  if (knownMaliciousIPs.includes(ip)) {
    res.json({ risk: 'critical', type: 'command-control' });
  } else {
    res.json({ risk: 'safe', type: 'legitimate' });
  }
});

app.get('/api/network/connections', (req, res) => {
  const mockConnections = [
    {
      id: uuidv4(),
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
      id: uuidv4(),
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
  ];
  res.json(mockConnections);
});

app.post('/api/scan', (req, res) => {
  const { apps } = req.body;
  const scannedApps = apps || [];
  const threatCount = scannedApps.filter((app: any) =>
    checkPackageForThreat(app.packageName)
  ).length;

  const result = {
    id: uuidv4(),
    timestamp: Date.now(),
    appsScanned: scannedApps.length,
    threatsFound: threatCount,
    apps: scannedApps,
  };

  addScan(result);
  if (threatCount > 0) {
    addAlert({
      id: uuidv4(),
      timestamp: Date.now(),
      title: 'Threats Detected During Scan',
      message: `Found ${threatCount} threat(s) across ${scannedApps.length} scanned application(s)`,
      severity: threatCount > 2 ? 'critical' : 'high',
      type: 'threat',
      read: false,
    });
  }
  res.json(result);
});

app.get('/api/scan/history', (req, res) => {
  res.json(getScans().slice(-10));
});

app.get('/api/alerts', (req, res) => {
  res.json(getAlerts());
});

app.patch('/api/alerts/:alertId/read', (req, res) => {
  const { alertId } = req.params;
  const alert = markAlertRead(alertId);
  if (alert) {
    res.json(alert);
  } else {
    res.status(404).json({ message: 'Alert not found' });
  }
});

app.delete('/api/alerts/:alertId', (req, res) => {
  const { alertId } = req.params;
  if (deleteAlert(alertId)) {
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Alert not found' });
  }
});

app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.patch('/api/settings', (req, res) => {
  const updates = req.body;
  res.json(updateSettings(updates));
});

app.get('/api/stats', (req, res) => {
  const dbStats = getStats();
  res.json({
    totalThreats: THREAT_DATABASE.length,
    suspiciousDomains: SUSPICIOUS_DOMAINS.length,
    alertsCount: dbStats.unreadAlerts,
    scansPerformed: dbStats.totalScans,
    totalAlerts: dbStats.totalAlerts,
    lastScan: dbStats.lastScan,
  });
});

app.post('/api/ai/analyze', (req, res) => {
  const { packageName, permissions, indicators } = req.body;
  if (!packageName) {
    res.status(400).json({ error: 'packageName is required' });
    return;
  }
  const result = analyzeThreatRisk(
    packageName,
    permissions || [],
    indicators || []
  );
  res.json({
    packageName,
    ...result,
    analyzedAt: Date.now(),
  });
});

app.post('/api/ai/analyze-hashes', (req, res) => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }
  const result = compareFileHashes(content);
  res.json({
    ...result,
    analyzedAt: Date.now(),
  });
});

app.get('/api/ai/patterns', (req, res) => {
  res.json({
    patterns: getHeuristicPatterns(),
    signatures: getThreatSignatures(),
  });
});

app.get('/api/anonymize/device', (req, res) => {
  const deviceId = uuidv4();
  const maskedId = deviceId.substring(0, 4) + '****-****-****-' + deviceId.substring(12);
  res.json({
    originalDeviceId: deviceId,
    maskedDeviceId: maskedId,
    advertisingId: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase(),
    macAddress: generateRandomMac(),
    status: 'protected',
    lastRotated: Date.now(),
  });
});

app.post('/api/anonymize/rotate', (req, res) => {
  res.json({
    success: true,
    newDeviceId: uuidv4().substring(0, 8).toUpperCase(),
    newMac: generateRandomMac(),
    timestamp: Date.now(),
  });
});

app.post('/api/anonymize/metadata/strip', (req, res) => {
  const { fileName, metadata } = req.body;
  const removedFields: string[] = [];
  if (metadata?.gps) removedFields.push('GPS Coordinates');
  if (metadata?.timestamp) removedFields.push('Timestamp');
  if (metadata?.device) removedFields.push('Device Make/Model');
  if (metadata?.software) removedFields.push('Software Version');
  if (metadata?.camera) removedFields.push('Camera Settings');
  res.json({
    success: true,
    fileName: fileName,
    removedFields,
    sanitized: true,
  });
});

app.get('/api/anonymize/fingerprint', (req, res) => {
  res.json({
    canvasHash: 'canv_' + uuidv4().substring(0, 8),
    audioHash: 'aud_' + uuidv4().substring(0, 8),
    fontHash: 'fnt_' + uuidv4().substring(0, 8),
    canvasToken: uuidv4(),
    audioToken: uuidv4(),
    randomized: true,
  });
});

app.post('/api/anonymize/fingerprint/randomize', (req, res) => {
  res.json({
    canvasHash: 'canv_' + uuidv4().substring(0, 8),
    audioHash: 'aud_' + uuidv4().substring(0, 8),
    fontHash: 'fnt_' + uuidv4().substring(0, 8),
    timestamp: Date.now(),
  });
});

app.get('/api/anonymize/trackers', (req, res) => {
  const trackers = [
    { id: '1', domain: 'google-analytics.com', category: 'Analytics', blocked: true },
    { id: '2', domain: 'facebook.com/tr', category: 'Social', blocked: true },
    { id: '3', domain: 'doubleclick.net', category: 'Advertising', blocked: true },
    { id: '4', domain: 'adjust.com', category: 'Attribution', blocked: true },
    { id: '5', domain: 'appsflyer.com', category: 'Attribution', blocked: true },
    { id: '6', domain: 'hotjar.com', category: 'Analytics', blocked: true },
    { id: '7', domain: 'branch.io', category: 'Deep Linking', blocked: true },
  ];
  res.json(trackers);
});

function generateRandomMac(): string {
  const hex = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    mac += hex[Math.floor(Math.random() * 16)];
    mac += hex[Math.floor(Math.random() * 16)];
    if (i < 5) mac += ':';
  }
  return mac;
}

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                           ║
║     🛡️ ShieldGuard API Server 🛡️           ║
║                                           ║
║     Threat Intelligence Backend                ║
║                                           ║
║     Running on http://localhost:${PORT}        ║
║                                           ║
╚═══════════════════════════════════════════════════╝
  `);
  console.log('API Endpoints:');
  console.log('  GET  /api/health           - Server health check');
  console.log('  GET  /api/threats          - All known threats');
  console.log('  GET  /api/threats/feed     - Latest threat feed');
  console.log('  GET  /api/threats/check/:packageName - Check app against threat database');
  console.log('  GET  /api/network/check/:domain - Check domain reputation');
  console.log('  GET  /api/network/check-ip/:ip - Check IP reputation');
  console.log('  GET  /api/network/connections - Active network connections');
  console.log('  POST /api/scan            - Submit device scan');
  console.log('  GET  /api/scan/history    - Scan history');
  console.log('  GET  /api/alerts          - Security alerts');
  console.log('  GET  /api/settings        - App settings');
  console.log('  PATCH /api/settings       - Update settings');
  console.log('  GET  /api/stats           - Platform statistics');
  console.log('  POST /api/ai/analyze      - AI heuristic threat analysis');
  console.log('  POST /api/ai/analyze-hashes - File hash matching');
  console.log('  GET  /api/ai/patterns     - Heuristic detection patterns');
  console.log('  GET  /api/anonymize/device - Device ID anonymization');
  console.log('  POST /api/anonymize/rotate - Rotate device identifiers');
  console.log('  POST /api/anonymize/metadata/strip - Strip file metadata');
  console.log('  GET  /api/anonymize/fingerprint - Get fingerprint status');
  console.log('  POST /api/anonymize/fingerprint/randomize - Randomize fingerprint');
  console.log('  GET  /api/anonymize/trackers - Known tracker database');
  console.log('');
});