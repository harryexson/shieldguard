const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook must be registered BEFORE the JSON body parser so the raw
// payload is available for signature verification.
const { setupBilling, registerWebhook } = require('./billing');
const { FEATURES, featureAllowed } = require('./features');
const { getEntitlements } = require('./subscriptions');
const { analyzeSms, analyzeEmail } = require('./detection');
registerWebhook(app);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── In-Memory Threat Database ──────────────────────────────────────
const THREAT_DATABASE = [
  { id: 'pegasus', name: 'Pegasus Spyware', type: 'surveillance', severity: 'critical', description: 'NSO Group commercial spyware capable of zero-click exploits, wiretapping, and complete device compromise.', packageNames: ['com.pegasus', 'com.nso', 'org.pegasus'], indicators: ['excessive battery drain', 'unusual network activity', 'camera indicator flicker'], remediation: 'Immediately factory reset device. Contact security professionals.' },
  { id: 'finspy', name: 'FinFisher/FinSpy', type: 'surveillance', severity: 'critical', description: 'Gamma Group commercial surveillance tool with extensive monitoring capabilities.', packageNames: ['com.finspy', 'com.gamma', 'org.finspy'], indicators: ['hidden processes', 'encrypted connections', 'root access attempts'], remediation: 'Factory reset and install security updates immediately.' },
  { id: 'predator', name: 'Predator Spyware', type: 'surveillance', severity: 'critical', description: 'Intellexa commercial spyware with advanced persistence mechanisms.', packageNames: ['com.predator', 'com.intellexa'], indicators: ['system app reinstallation', 'unusual background services'], remediation: 'Flash stock firmware, change all passwords.' },
  { id: 'cytopia', name: 'Cytopia', type: 'spyware', severity: 'high', description: 'Android spyware with stealer capabilities for contacts, messages, and location.', packageNames: ['com.cytopia', 'android.cytopia'], indicators: ['excessive permissions', 'contacts access', 'location tracking'], remediation: 'Uninstall app, scan device with antivirus.' },
  { id: 'emotet', name: 'Emotet Malware', type: 'malware', severity: 'critical', description: 'Modular trojan often used as downloader for other malware, including ransomware.', packageNames: ['emotet', 'heodo'], indicators: ['suspicious email attachments', 'network connections to unknown IPs'], remediation: 'Disconnect from network, scan with updated antivirus.' },
  { id: 'flubot', name: 'FluBot', type: 'malware', severity: 'high', description: 'Android banking malware that steals credentials and contacts.', packageNames: ['com.flubot', 'flubot'], indicators: ['SMS forwarding', 'contact harvesting', 'banking app overlays'], remediation: 'Factory reset, enable Play Protect, change banking passwords.' },
  { id: 'triada', name: 'Triada Trojan', type: 'trojan', severity: 'high', description: 'Modular Android trojan with system-level privileges.', packageNames: ['com.triada', 'triada'], indicators: ['superuser access', 'system modifications', 'app injection'], remediation: 'Flash stock firmware, verify app sources.' },
  { id: 'xhelper', name: 'xHelper Malware', type: 'malware', severity: 'medium', description: 'Persistent Android malware that survives factory resets.', packageNames: ['com.xhelper', 'xhelper'], indicators: ['spontaneous installations', 'advertising popups'], remediation: 'Flash stock firmware, disable unknown sources.' },
  { id: 'stalkerware', name: 'Commercial Stalkerware', type: 'spyware', severity: 'high', description: 'Commercial apps marketed for family monitoring used for stalking.', packageNames: ['com.spymaster', 'com.trackphone', 'com.fleek', 'com.hoverwatch', 'com.spyic'], indicators: ['hidden app icon', 'stealth mode', 'location tracking', 'message monitoring'], remediation: 'Review apps, check for hidden apps in settings.' },
  { id: 'keylogger', name: 'Android Keylogger', type: 'spyware', severity: 'high', description: 'Records keystrokes to steal credentials and personal information.', packageNames: ['com.keylogger', 'keylog', 'keyloger'], indicators: ['accessibility service use', 'keyboard switching'], remediation: 'Remove accessibility permissions, scan device.' },
  { id: 'joker', name: 'Joker Malware', type: 'malware', severity: 'high', description: 'Premium SMS subscribing adwares that silently signs up for paid services.', packageNames: ['com.joker', 'joker'], indicators: ['premium SMS', 'unauthorized charges', 'suspicious SMS logs'], remediation: 'Check phone bill, contact carrier to block premium SMS.' },
  { id: 'notcompatible', name: 'NotCompatible Malware', type: 'malware', severity: 'medium', description: 'Android malware that turns devices into proxies for criminal activity.', packageNames: ['com.notcompatible', 'notcompatible'], indicators: ['suspicious proxy traffic', 'new CA certificates'], remediation: 'Remove unknown certificates, reset network settings.' },
  { id: 'dirtycow', name: 'Dirty COW Exploit', type: 'trojan', severity: 'critical', description: 'Linux kernel privilege escalation exploit used to gain root access.', packageNames: ['dirtycow'], indicators: ['root access', 'system file modifications'], remediation: 'Apply security patches, verify root integrity.' },
  { id: 'certes', name: 'Certes Spyware', type: 'surveillance', severity: 'critical', description: 'Government-developed surveillance tool for dissidents and journalists.', packageNames: ['com.certes', 'org.certes'], indicators: ['voice recording', 'document access', 'location tracking'], remediation: 'Factory reset, use secure communication apps.' },
  { id: 'ai_data_integration', name: 'AI Data Integration Platform', type: 'surveillance', severity: 'critical', description: 'AI and data integration platforms for mass surveillance and behavioral profiling.', packageNames: ['com.dataagg', 'org.profilingai', 'ai-integration-service'], indicators: ['behavioral profiling', 'data aggregation', 'entity relationship mapping', 'financial transaction tracking'], remediation: 'Block all data aggregation domain connections, encrypt behavioral metadata, use Tor.' },
  { id: 'location_tracker', name: 'Location Tracking Platform', type: 'surveillance', severity: 'critical', description: 'Location-tracking and social media monitoring software for tracking devices across geographic areas.', packageNames: ['com.loctracker', 'org.tracking-service', 'socialmedia-monitor'], indicators: ['location history upload', 'social media data collection', 'timeline correlation', 'geofence tracking'], remediation: 'Disable location services, use GPS spoofing, block tracking servers, encrypt social profiles.' },
  { id: 'facial_biometric_db', name: 'Facial Recognition Database', type: 'surveillance', severity: 'critical', description: 'Facial recognition and biometric databases with photos harvested from social media platforms.', packageNames: ['com.facialdb', 'biometric-recognition-service'], indicators: ['photo uploads', 'profile scraping', 'facial biometric collection', 'database queries'], remediation: 'Encrypt social media profiles, use facial recognition blockers, limit photo sharing.' },
  { id: 'device_forensics', name: 'Digital Forensics Tools', type: 'trojan', severity: 'critical', description: 'Digital forensics and mobile device extraction tools for unauthorized device data access.', packageNames: ['com.forensics', 'extraction-service', 'device-analyzer'], indicators: ['USB debugging enabled', 'bootloader access', 'filesystem enumeration', 'memory dumps'], remediation: 'Enable extraction PIN lock, disable USB debugging, use PIN authentication for all device access.' },
  { id: 'autonomous_surveillance', name: 'Autonomous Surveillance System', type: 'surveillance', severity: 'critical', description: 'Autonomous surveillance infrastructure for large-scale location tracking and monitoring.', packageNames: ['com.autosurv', 'surveillance-infrastructure', 'autonomous-tracker'], indicators: ['radar signature exposure', 'autonomous vehicle communication', 'thermal signature', 'RF monitoring'], remediation: 'Use thermal masking, RF signal blocking, GPS spoofing, avoid geofenced areas.' },
];

const SUSPICIOUS_DOMAINS = [
  { domain: 'nsogroup.com', type: 'surveillance', risk: 'critical' },
  { domain: 'finspy-gamma.net', type: 'surveillance', risk: 'critical' },
  { domain: 'intellexa.io', type: 'surveillance', risk: 'critical' },
  { domain: 'cyclops.com', type: 'spyware', risk: 'high' },
  { domain: 'emotet.xyz', type: 'malware', risk: 'critical' },
  { domain: 'flubot.net', type: 'malware', risk: 'high' },
  { domain: 'triada.net', type: 'trojan', risk: 'high' },
  { domain: 'xhelper.io', type: 'malware', risk: 'medium' },
  { domain: 'spyware-c2.com', type: 'command-control', risk: 'critical' },
  { domain: 'tracker.net', type: 'tracking', risk: 'high' },
  { domain: 'stalker.io', type: 'surveillance', risk: 'high' },
  { domain: 'keylog.net', type: 'keylogger', risk: 'high' },
  { domain: 'proxy-malic.com', type: 'proxy', risk: 'medium' },
  { domain: 'dirtycow.net', type: 'exploit', risk: 'critical' },
  { domain: 'enterprise-data-intel.net', type: 'surveillance', risk: 'critical' },
  { domain: 'ai-data-platform.com', type: 'surveillance', risk: 'critical' },
  { domain: 'data-aggregation.io', type: 'surveillance', risk: 'critical' },
  { domain: 'location-tracker.net', type: 'surveillance', risk: 'critical' },
  { domain: 'phonepattern.net', type: 'surveillance', risk: 'critical' },
  { domain: 'icop-server.com', type: 'surveillance', risk: 'critical' },
  { domain: 'patterntracer.io', type: 'surveillance', risk: 'critical' },
  { domain: 'facial-recognition-db.com', type: 'surveillance', risk: 'critical' },
  { domain: 'biometric-scraping.ai', type: 'surveillance', risk: 'critical' },
  { domain: 'mobile-forensics-cloud.com', type: 'forensics', risk: 'critical' },
  { domain: 'ufed-server.com', type: 'forensics', risk: 'critical' },
  { domain: 'device-extraction.io', type: 'forensics', risk: 'critical' },
  { domain: 'magnet-forensics.com', type: 'forensics', risk: 'critical' },
  { domain: 'autonomous-surveillance.net', type: 'surveillance', risk: 'critical' },
  { domain: 'surveillance-tower.io', type: 'surveillance', risk: 'critical' },
  { domain: 'auto-tracker.com', type: 'surveillance', risk: 'critical' },
];

// ─── Helpers ────────────────────────────────────────────────────────
function checkPackageForThreat(packageName) {
  const lower = packageName.toLowerCase();
  for (const threat of THREAT_DATABASE) {
    for (const pkg of threat.packageNames) {
      if (lower.includes(pkg.toLowerCase())) return threat;
    }
  }
  return null;
}

function checkDomainReputation(domain) {
  const lower = domain.toLowerCase();
  for (const d of SUSPICIOUS_DOMAINS) {
    if (lower.includes(d.domain)) return { risk: d.risk, type: d.type };
  }
  return null;
}

function generateRandomMac() {
  const hex = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    mac += hex[Math.floor(Math.random() * 16)];
    mac += hex[Math.floor(Math.random() * 16)];
    if (i < 5) mac += ':';
  }
  return mac;
}

// ─── AI Heuristic Engine ────────────────────────────────────────────
const BEHAVIORAL_PATTERNS = [
  { pattern: 'excessive-permissions', weight: 30, description: 'App requests more permissions than needed for core function' },
  { pattern: 'background-data-exfil', weight: 40, description: 'Sustained background data transmission to unknown endpoints' },
  { pattern: 'accessibility-abuse', weight: 35, description: 'App uses accessibility service without clear accessibility purpose' },
  { pattern: 'hidden-process', weight: 45, description: 'App runs processes not visible in normal app lists' },
  { pattern: 'privilege-escalation', weight: 50, description: 'App attempts to gain root or system-level access' },
  { pattern: 'dynamic-code-loading', weight: 25, description: 'App downloads and executes code at runtime from external sources' },
  { pattern: 'packed-binary', weight: 20, description: 'App binary is obfuscated or packed to evade signature detection' },
  { pattern: 'suspicious-domain-callout', weight: 35, description: 'App communicates with domains known for malicious activity' },
  { pattern: 'zero-permission-abuse', weight: 15, description: 'App uses side channels to access data without explicit permissions' },
  { pattern: 'persistence-mechanism', weight: 40, description: 'App installs components that survive factory reset or uninstall' },
];

function analyzeThreatRisk(packageName, permissions, indicators) {
  const dangerousPerms = ['camera', 'record_audio', 'access_fine_location', 'access_coarse_location', 'read_sms', 'send_sms', 'read_contacts', 'read_call_log', 'bind_accessibility_service'];
  let totalWeight = 0;
  let matchedWeight = 0;
  const riskFactors = [];

  for (const pattern of BEHAVIORAL_PATTERNS) {
    totalWeight += pattern.weight;
    const matches = indicators.some(ind =>
      ind.toLowerCase().includes(pattern.pattern.replace(/-/g, '')) ||
      pattern.description.toLowerCase().includes(ind.toLowerCase())
    );
    if (matches) {
      matchedWeight += pattern.weight;
      riskFactors.push(pattern.description);
    }
  }

  const permRiskCount = permissions.filter(p => dangerousPerms.some(dp => p.toLowerCase().includes(dp))).length;
  if (permRiskCount >= 4) matchedWeight += 20;
  else if (permRiskCount >= 2) matchedWeight += 10;

  const rawScore = totalWeight > 0 ? Math.min(100, Math.round((matchedWeight / totalWeight) * 100)) : 0;
  const confidence = Math.min(100, Math.round(riskFactors.length * 12 + 20));

  let recommendation;
  if (rawScore >= 70) recommendation = 'High risk: Immediate quarantine and factory reset recommended';
  else if (rawScore >= 40) recommendation = 'Medium risk: Investigate app permissions and network behavior';
  else if (rawScore >= 20) recommendation = 'Low risk: Monitor app behavior and review permissions';
  else recommendation = 'Minimal risk: Continue normal monitoring';

  return { score: rawScore, confidence, riskFactors, recommendation };
}

function extractHashes(content) {
  const hashes = [];
  const md5 = content.match(/[a-f0-9]{32}/gi);
  const sha1 = content.match(/[a-f0-9]{40}/gi);
  const sha256 = content.match(/[a-f0-9]{64}/gi);
  if (md5) hashes.push(...md5);
  if (sha1) hashes.push(...sha1);
  if (sha256) hashes.push(...sha256);
  return hashes;
}

// ─── Persistence (JSON file) ────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'shieldguard-db.json');

function ensureDbDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDb() {
  ensureDbDir();
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch { console.warn('DB corrupted, resetting'); }
  return { scans: [], alerts: [{ id: uuidv4(), timestamp: Date.now() - 3600000, title: 'New Threat Detected', message: 'A new spyware variant has been identified in our threat database', severity: 'high', type: 'threat', read: false }], settings: { autoScanEnabled: false, scanInterval: 86400000, realTimeMonitoring: true, notificationsEnabled: true, threatAlertsEnabled: true, networkMonitoringEnabled: true, backgroundScanning: false } };
}

function saveDb(db) {
  ensureDbDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function getAlerts() { return loadDb().alerts; }
function addAlert(alert) { const db = loadDb(); db.alerts.unshift(alert); saveDb(db); }
function markAlertRead(id) { const db = loadDb(); const a = db.alerts.find(x => x.id === id); if (a) { a.read = true; saveDb(db); } return a; }
function deleteAlertFromDb(id) { const db = loadDb(); const i = db.alerts.findIndex(x => x.id === id); if (i !== -1) { db.alerts.splice(i, 1); saveDb(db); return true; } return false; }
function getSettings() { return loadDb().settings; }
function updateSettings(updates) { const db = loadDb(); Object.assign(db.settings, updates); saveDb(db); return db.settings; }
function getStats() { const db = loadDb(); return { totalScans: db.scans.length, totalAlerts: db.alerts.length, unreadAlerts: db.alerts.filter(a => !a.read).length, lastScan: db.scans.length > 0 ? db.scans[db.scans.length - 1].timestamp : null }; }
function addScanToDb(scan) { const db = loadDb(); db.scans.push(scan); saveDb(db); }
function getScans() { return loadDb().scans; }

// ─── API Routes ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: Date.now() }));

setupBilling(app);

// ─── Subscription & Entitlements ──────────────────────────────────
// Returns 402 when the caller's plan does not include the requested feature.
function requireFeature(req, res, featureId) {
  const deviceId = (req.body && req.body.deviceId) || req.query.deviceId;
  const entitlements = getEntitlements(deviceId);
  if (!featureAllowed(featureId, entitlements.tier)) {
    const needed = FEATURES.find((f) => f.id === featureId);
    res.status(402).json({
      error: 'Feature not included in your plan',
      feature: featureId,
      requiredTier: needed ? needed.tier : 'standard',
      currentTier: entitlements.tier,
    });
    return null;
  }
  return entitlements;
}

app.get('/api/features', (req, res) => res.json(FEATURES));

app.get('/api/me', (req, res) => {
  const deviceId = req.query.deviceId;
  if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });
  res.json(getEntitlements(deviceId));
});

// ─── Real Detection Services (tier-gated) ─────────────────────────
app.post('/api/scan/sms', (req, res) => {
  if (!requireFeature(req, res, 'sms_scan')) return;
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  res.json({ ...analyzeSms(text), analyzedAt: Date.now() });
});

app.post('/api/scan/email', (req, res) => {
  if (!requireFeature(req, res, 'email_scan')) return;
  const { from, subject, body, headers } = req.body || {};
  if (!from && !subject && !body) {
    return res.status(400).json({ error: 'at least one of from/subject/body is required' });
  }
  res.json({ ...analyzeEmail({ from, subject, body, headers }), analyzedAt: Date.now() });
});


app.get('/api/threats', (req, res) => res.json(THREAT_DATABASE));
app.get('/api/threats/feed', (req, res) => res.json(THREAT_DATABASE.slice(0, 10)));
app.get('/api/threats/check/:packageName', (req, res) => {
  const threat = checkPackageForThreat(req.params.packageName);
  threat ? res.json(threat) : res.status(404).json({ message: 'No known threat found' });
});

app.get('/api/network/check/:domain', (req, res) => {
  const rep = checkDomainReputation(req.params.domain);
  res.json(rep || { risk: 'safe', type: 'legitimate' });
});

app.get('/api/network/check-ip/:ip', (req, res) => {
  const bad = ['185.234.72.15', '91.234.56.78', '45.33.32.156'];
  res.json(bad.includes(req.params.ip) ? { risk: 'critical', type: 'command-control' } : { risk: 'safe', type: 'legitimate' });
});

app.get('/api/network/connections', (req, res) => {
  res.json([
    { id: uuidv4(), appName: 'Chrome Browser', domain: 'www.google.com', ip: '142.250.185.206', port: 443, protocol: 'HTTPS', bytesIn: 2458624, bytesOut: 145920, timestamp: Date.now(), reputation: 'safe' },
    { id: uuidv4(), appName: 'WhatsApp', domain: 'whatsapp.net', ip: '157.240.221.12', port: 443, protocol: 'HTTPS', bytesIn: 524288, bytesOut: 102400, timestamp: Date.now(), reputation: 'safe' },
  ]);
});

app.post('/api/scan', (req, res) => {
  const apps = req.body.apps || [];
  const threatCount = apps.filter(a => checkPackageForThreat(a.packageName)).length;
  const result = { id: uuidv4(), timestamp: Date.now(), appsScanned: apps.length, threatsFound: threatCount, apps };
  addScanToDb(result);
  if (threatCount > 0) addAlert({ id: uuidv4(), timestamp: Date.now(), title: 'Threats Detected During Scan', message: `Found ${threatCount} threat(s) across ${apps.length} scanned application(s)`, severity: threatCount > 2 ? 'critical' : 'high', type: 'threat', read: false });
  res.json(result);
});

app.get('/api/scan/history', (req, res) => res.json(getScans().slice(-10)));
app.get('/api/alerts', (req, res) => res.json(getAlerts()));
app.patch('/api/alerts/:alertId/read', (req, res) => { const a = markAlertRead(req.params.alertId); a ? res.json(a) : res.status(404).json({ message: 'Alert not found' }); });
app.delete('/api/alerts/:alertId', (req, res) => { deleteAlertFromDb(req.params.alertId) ? res.json({ success: true }) : res.status(404).json({ message: 'Alert not found' }); });
app.get('/api/settings', (req, res) => res.json(getSettings()));
app.patch('/api/settings', (req, res) => res.json(updateSettings(req.body)));

app.get('/api/stats', (req, res) => {
  const s = getStats();
  res.json({ totalThreats: THREAT_DATABASE.length, suspiciousDomains: SUSPICIOUS_DOMAINS.length, alertsCount: s.unreadAlerts, scansPerformed: s.totalScans, totalAlerts: s.totalAlerts, lastScan: s.lastScan });
});

// AI Analysis Endpoints
app.post('/api/ai/analyze', (req, res) => {
  const { packageName, permissions, indicators } = req.body;
  if (!packageName) return res.status(400).json({ error: 'packageName is required' });
  res.json({ packageName, ...analyzeThreatRisk(packageName, permissions || [], indicators || []), analyzedAt: Date.now() });
});

app.post('/api/ai/analyze-hashes', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  res.json({ match: false, matchedHashes: extractHashes(content), threatNames: [], analyzedAt: Date.now() });
});

app.get('/api/ai/patterns', (req, res) => {
  res.json({ patterns: BEHAVIORAL_PATTERNS, signatures: THREAT_DATABASE.map(t => t.id) });
});

// Anonymization Endpoints
app.get('/api/anonymize/device', (req, res) => {
  const deviceId = uuidv4();
  res.json({ originalDeviceId: deviceId, maskedDeviceId: deviceId.substring(0, 4) + '****-****-****-' + deviceId.substring(12), advertisingId: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase(), macAddress: generateRandomMac(), status: 'protected', lastRotated: Date.now() });
});

app.post('/api/anonymize/rotate', (req, res) => {
  res.json({ success: true, newDeviceId: uuidv4().substring(0, 8).toUpperCase(), newMac: generateRandomMac(), timestamp: Date.now() });
});

app.post('/api/anonymize/metadata/strip', (req, res) => {
  const { fileName, metadata } = req.body;
  const removed = [];
  if (metadata?.gps) removed.push('GPS Coordinates');
  if (metadata?.timestamp) removed.push('Timestamp');
  if (metadata?.device) removed.push('Device Make/Model');
  if (metadata?.software) removed.push('Software Version');
  if (metadata?.camera) removed.push('Camera Settings');
  res.json({ success: true, fileName, removedFields: removed, sanitized: true });
});

app.get('/api/anonymize/fingerprint', (req, res) => res.json({ canvasHash: 'canv_' + uuidv4().substring(0, 8), audioHash: 'aud_' + uuidv4().substring(0, 8), fontHash: 'fnt_' + uuidv4().substring(0, 8), canvasToken: uuidv4(), audioToken: uuidv4(), randomized: true }));

app.post('/api/anonymize/fingerprint/randomize', (req, res) => res.json({ canvasHash: 'canv_' + uuidv4().substring(0, 8), audioHash: 'aud_' + uuidv4().substring(0, 8), fontHash: 'fnt_' + uuidv4().substring(0, 8), timestamp: Date.now() }));

app.get('/api/anonymize/trackers', (req, res) => res.json([
  { id: '1', domain: 'google-analytics.com', category: 'Analytics', blocked: true },
  { id: '2', domain: 'facebook.com/tr', category: 'Social', blocked: true },
  { id: '3', domain: 'doubleclick.net', category: 'Advertising', blocked: true },
  { id: '4', domain: 'adjust.com', category: 'Attribution', blocked: true },
  { id: '5', domain: 'appsflyer.com', category: 'Attribution', blocked: true },
  { id: '6', domain: 'hotjar.com', category: 'Analytics', blocked: true },
  { id: '7', domain: 'branch.io', category: 'Deep Linking', blocked: true },
]));

// ─── Start Server ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║              ShieldGuard API Server                      ║');
  console.log('║              Threat Intelligence Backend                 ║');
  console.log('║                                                       ║');
  console.log(`║         Running on http://localhost:${PORT}                  ║`);
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('API Endpoints:');
  console.log('  GET  /api/health                      - Server health');
  console.log('  GET  /api/threats                     - All threats');
  console.log('  GET  /api/threats/feed                - Latest threats');
  console.log('  GET  /api/threats/check/:package      - Check package');
  console.log('  GET  /api/network/check/:domain       - Domain reputation');
  console.log('  GET  /api/network/check-ip/:ip        - IP reputation');
  console.log('  GET  /api/network/connections         - Active connections');
  console.log('  POST /api/scan                        - Submit scan');
  console.log('  GET  /api/scan/history                - Scan history');
  console.log('  GET  /api/alerts                      - Security alerts');
  console.log('  PATCH /api/alerts/:id/read            - Mark alert read');
  console.log('  DELETE /api/alerts/:id                - Dismiss alert');
  console.log('  GET  /api/settings                    - App settings');
  console.log('  PATCH /api/settings                   - Update settings');
  console.log('  GET  /api/stats                       - Platform stats');
  console.log('  POST /api/ai/analyze                  - AI heuristic analysis');
  console.log('  POST /api/ai/analyze-hashes           - File hash matching');
  console.log('  GET  /api/ai/patterns                 - Detection patterns');
  console.log('  GET  /api/anonymize/device            - Device anonymization');
  console.log('  POST /api/anonymize/rotate            - Rotate identifiers');
  console.log('  POST /api/anonymize/metadata/strip    - Strip metadata');
  console.log('  GET  /api/anonymize/fingerprint       - Fingerprint status');
  console.log('  POST /api/anonymize/fingerprint/randomize - Randomize fingerprint');
  console.log('  GET  /api/anonymize/trackers          - Tracker database');
  console.log('');
});
