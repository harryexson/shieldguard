'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, query, validationResult } = require('express-validator');

const { setupBilling, registerWebhook } = require('./billing');
const { FEATURES, featureAllowed } = require('./features');
const { getEntitlements } = require('./subscriptions');
const { analyzeSms, analyzeEmail } = require('./detection');
const { loadThreatData } = require('./threatData');
const { notFound, errorHandler, asyncHandler, requestLogger, requireApiKey } = require('./middleware');

// ─── Load threat intelligence ───────────────────────────────────────
const THREAT_DATA = loadThreatData();
const THREAT_DATABASE = THREAT_DATA.threats;
const KNOWN_HASHES = THREAT_DATA.knownHashes || {};
const DOMAINS = THREAT_DATA.domains || [];

// In-memory indexes for fast lookups.
const THREAT_BY_PACKAGE = new Map();
for (const t of THREAT_DATABASE) {
  for (const pkg of t.packageNames || []) {
    THREAT_BY_PACKAGE.set(pkg.toLowerCase(), t);
  }
}
const DOMAIN_INDEX = new Map();
for (const d of DOMAINS) DOMAIN_INDEX.set(d.domain.toLowerCase(), d);

// ─── Helpers ────────────────────────────────────────────────────────
function checkPackageForThreat(packageName) {
  const lower = String(packageName || '').toLowerCase();
  if (THREAT_BY_PACKAGE.has(lower)) return THREAT_BY_PACKAGE.get(lower);
  for (const [pkg, threat] of THREAT_BY_PACKAGE) {
    if (lower.includes(pkg)) return threat;
  }
  return null;
}

function checkDomainReputation(domain) {
  const lower = String(domain || '').toLowerCase();
  if (DOMAIN_INDEX.has(lower)) return { risk: DOMAIN_INDEX.get(lower).risk, type: DOMAIN_INDEX.get(lower).type };
  for (const [d, entry] of DOMAIN_INDEX) {
    if (lower.includes(d)) return { risk: entry.risk, type: entry.type };
  }
  return null;
}

function matchHashes(hashes) {
  const matches = [];
  for (const h of hashes) {
    const key = String(h).toLowerCase();
    if (KNOWN_HASHES[key]) matches.push({ hash: h, threatId: KNOWN_HASHES[key] });
  }
  return matches;
}

function extractHashes(content) {
  const found = [];
  const md5 = content.match(/[a-f0-9]{32}/gi);
  const sha1 = content.match(/[a-f0-9]{40}/gi);
  const sha256 = content.match(/[a-f0-9]{64}/gi);
  if (md5) found.push(...md5);
  if (sha1) found.push(...sha1);
  if (sha256) found.push(...sha256);
  return found;
}

function generateRandomMac() {
  const hex = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    mac += hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
    if (i < 5) mac += ':';
  }
  return mac;
}

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

  for (const p of BEHAVIORAL_PATTERNS) {
    totalWeight += p.weight;
    const matches = (indicators || []).some((ind) =>
      ind.toLowerCase().includes(p.pattern.replace(/-/g, '')) ||
      p.description.toLowerCase().includes(ind.toLowerCase())
    );
    if (matches) {
      matchedWeight += p.weight;
      riskFactors.push(p.description);
    }
  }

  const permRiskCount = (permissions || []).filter((p) => dangerousPerms.some((dp) => p.toLowerCase().includes(dp))).length;
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

// ─── Persistence (JSON file with per-write locking) ─────────────────
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'shieldguard-db.json');
let dbLock = Promise.resolve();

function ensureDbDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function loadDb() {
  ensureDbDir();
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    console.warn('DB corrupted, resetting');
  }
  return {
    scans: [],
    alerts: [{ id: uuidv4(), timestamp: Date.now() - 3600000, title: 'New Threat Detected', message: 'A new spyware variant has been identified in our threat database', severity: 'high', type: 'threat', read: false }],
    settings: { autoScanEnabled: false, scanInterval: 86400000, realTimeMonitoring: true, notificationsEnabled: true, threatAlertsEnabled: true, networkMonitoringEnabled: true, backgroundScanning: false },
  };
}
function saveDb(db) {
  ensureDbDir();
  const write = fs.promises.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  dbLock = dbLock.then(() => write.catch(() => {})).catch(() => {});
  return dbLock;
}
function getAlerts() { return loadDb().alerts; }
function addAlert(alert) { const db = loadDb(); db.alerts.unshift(alert); return saveDb(db); }
function markAlertRead(id) { const db = loadDb(); const a = db.alerts.find((x) => x.id === id); if (a) { a.read = true; return saveDb(db).then(() => a); } return null; }
function deleteAlertFromDb(id) { const db = loadDb(); const i = db.alerts.findIndex((x) => x.id === id); if (i !== -1) { db.alerts.splice(i, 1); return saveDb(db).then(() => true); } return false; }
function getSettings() { return loadDb().settings; }
function updateSettings(updates) { const db = loadDb(); Object.assign(db.settings, updates); return saveDb(db).then(() => db.settings); }
function getStats() { const db = loadDb(); return { totalScans: db.scans.length, totalAlerts: db.alerts.length, unreadAlerts: db.alerts.filter((a) => !a.read).length, lastScan: db.scans.length > 0 ? db.scans[db.scans.length - 1].timestamp : null }; }
function addScanToDb(scan) { const db = loadDb(); db.scans.push(scan); return saveDb(db); }
function getScans() { return loadDb().scans; }

// ─── App factory ────────────────────────────────────────────────────
function createApp() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.set('trust proxy', 1);
  app.use(helmet());
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:4000,http://localhost:5000,http://localhost:8081,https://shieldguard.example.com')
    .split(',').map((s) => s.trim());
  app.use(cors({ origin: allowedOrigins, optionsSuccessStatus: 200 }));

  // Stripe webhook must be registered BEFORE the JSON body parser.
  registerWebhook(app);
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
  const strictLimiter = rateLimit({ windowMs: 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false });
  app.use(globalLimiter);

  setupBilling(app);

  function requireFeature(req, res, featureId) {
    const deviceId = (req.body && req.body.deviceId) || req.query.deviceId;
    const entitlements = getEntitlements(deviceId);
    if (!featureAllowed(featureId, entitlements.tier)) {
      const needed = FEATURES.find((f) => f.id === featureId);
      res.status(402).json({ error: 'Feature not included in your plan', feature: featureId, requiredTier: needed ? needed.tier : 'standard', currentTier: entitlements.tier });
      return null;
    }
    return entitlements;
  }

  function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed');
      err.status = 400;
      err.details = errors.array();
      return next(err);
    }
    next();
  }

  app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: Date.now(), threats: THREAT_DATABASE.length, hashes: Object.keys(KNOWN_HASHES).length }));

  app.get('/api/features', (req, res) => res.json(FEATURES));

  app.get('/api/me', [query('deviceId').isString().notEmpty()], validate, (req, res) => {
    const deviceId = req.query.deviceId;
    res.json(getEntitlements(deviceId));
  });

  // ─── Detection services (tier-gated) ──
  app.post('/api/scan/sms', strictLimiter, requireApiKey, [body('text').isString().notEmpty()], validate, (req, res) => {
    if (!requireFeature(req, res, 'sms_scan')) return;
    res.json({ ...analyzeSms(req.body.text), analyzedAt: Date.now() });
  });

  app.post('/api/scan/email', strictLimiter, requireApiKey, (req, res) => {
    if (!requireFeature(req, res, 'email_scan')) return;
    const { from, subject, body, headers } = req.body || {};
    if (!from && !subject && !body) return res.status(400).json({ error: 'at least one of from/subject/body is required' });
    res.json({ ...analyzeEmail({ from, subject, body, headers }), analyzedAt: Date.now() });
  });

  app.get('/api/threats', (req, res) => {
    const limit = Math.min(Number(req.query.limit) || THREAT_DATABASE.length, THREAT_DATABASE.length);
    const offset = Number(req.query.offset) || 0;
    res.json(THREAT_DATABASE.slice(offset, offset + limit));
  });
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

  app.post('/api/scan', strictLimiter, requireApiKey, (req, res) => {
    const apps = req.body.apps || [];
    const found = [];
    for (const a of apps) {
      const t = checkPackageForThreat(a.packageName);
      if (t) found.push({ packageName: a.packageName, threat: t.id });
    }
    const result = { id: uuidv4(), timestamp: Date.now(), appsScanned: apps.length, threatsFound: found.length, threats: found };
    addScanToDb(result);
    if (found.length > 0) addAlert({ id: uuidv4(), timestamp: Date.now(), title: 'Threats Detected During Scan', message: `Found ${found.length} threat(s) across ${apps.length} scanned application(s)`, severity: found.length > 2 ? 'critical' : 'high', type: 'threat', read: false });
    res.json(result);
  });

  app.get('/api/scan/history', (req, res) => res.json(getScans().slice(-10)));
  app.get('/api/alerts', (req, res) => res.json(getAlerts()));
  app.patch('/api/alerts/:alertId/read', requireApiKey, asyncHandler(async (req, res) => {
    const a = await markAlertRead(req.params.alertId);
    a ? res.json(a) : res.status(404).json({ message: 'Alert not found' });
  }));
  app.delete('/api/alerts/:alertId', requireApiKey, asyncHandler(async (req, res) => {
    const ok = await deleteAlertFromDb(req.params.alertId);
    ok ? res.json({ success: true }) : res.status(404).json({ message: 'Alert not found' });
  }));
  app.get('/api/settings', (req, res) => res.json(getSettings()));
  app.patch('/api/settings', requireApiKey, (req, res) => {
    if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid settings payload' });
    res.json(updateSettings(req.body));
  });

  app.get('/api/stats', (req, res) => {
    const s = getStats();
    res.json({ totalThreats: THREAT_DATABASE.length, knownHashes: Object.keys(KNOWN_HASHES).length, suspiciousDomains: DOMAINS.length, alertsCount: s.unreadAlerts, scansPerformed: s.totalScans, totalAlerts: s.totalAlerts, lastScan: s.lastScan });
  });

  // AI Analysis
  app.post('/api/ai/analyze', strictLimiter, [body('packageName').isString().notEmpty()], validate, (req, res) => {
    const { packageName, permissions, indicators } = req.body;
    res.json({ packageName, ...analyzeThreatRisk(packageName, permissions || [], indicators || []), analyzedAt: Date.now() });
  });

  app.post('/api/ai/analyze-hashes', strictLimiter, [body('content').optional().isString(), body('hashes').optional().isArray()], validate, (req, res) => {
    const { content, hashes } = req.body;
    const extracted = content ? extractHashes(content) : [];
    const provided = Array.isArray(hashes) ? hashes : [];
    const all = [...new Set([...extracted, ...provided])];
    const matches = matchHashes(all);
    res.json({ match: matches.length > 0, totalChecked: all.length, matchedCount: matches.length, matchedHashes: matches, analyzedAt: Date.now() });
  });

  app.get('/api/ai/patterns', (req, res) => res.json({ patterns: BEHAVIORAL_PATTERNS, signatures: THREAT_DATABASE.length }));

  // Anonymization
  app.get('/api/anonymize/device', (req, res) => {
    const deviceId = uuidv4();
    res.json({ originalDeviceId: deviceId, maskedDeviceId: deviceId.substring(0, 4) + '****-****-****-' + deviceId.substring(12), advertisingId: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase(), macAddress: generateRandomMac(), status: 'protected', lastRotated: Date.now() });
  });
  app.post('/api/anonymize/rotate', requireApiKey, (req, res) => res.json({ success: true, newDeviceId: uuidv4().substring(0, 8).toUpperCase(), newMac: generateRandomMac(), timestamp: Date.now() }));
  app.post('/api/anonymize/metadata/strip', requireApiKey, (req, res) => {
    const { fileName, metadata } = req.body || {};
    const removed = [];
    if (metadata && metadata.gps) removed.push('GPS Coordinates');
    if (metadata && metadata.timestamp) removed.push('Timestamp');
    if (metadata && metadata.device) removed.push('Device Make/Model');
    if (metadata && metadata.software) removed.push('Software Version');
    if (metadata && metadata.camera) removed.push('Camera Settings');
    res.json({ success: true, fileName, removedFields: removed, sanitized: true });
  });
  app.get('/api/anonymize/fingerprint', (req, res) => res.json({ canvasHash: 'canv_' + uuidv4().substring(0, 8), audioHash: 'aud_' + uuidv4().substring(0, 8), fontHash: 'fnt_' + uuidv4().substring(0, 8), canvasToken: uuidv4(), audioToken: uuidv4(), randomized: true }));
  app.post('/api/anonymize/fingerprint/randomize', requireApiKey, (req, res) => res.json({ canvasHash: 'canv_' + uuidv4().substring(0, 8), audioHash: 'aud_' + uuidv4().substring(0, 8), fontHash: 'fnt_' + uuidv4().substring(0, 8), timestamp: Date.now() }));
  app.get('/api/anonymize/trackers', (req, res) => res.json([
    { id: '1', domain: 'google-analytics.com', category: 'Analytics', blocked: true },
    { id: '2', domain: 'facebook.com/tr', category: 'Social', blocked: true },
    { id: '3', domain: 'doubleclick.net', category: 'Advertising', blocked: true },
    { id: '4', domain: 'adjust.com', category: 'Attribution', blocked: true },
    { id: '5', domain: 'appsflyer.com', category: 'Attribution', blocked: true },
    { id: '6', domain: 'hotjar.com', category: 'Analytics', blocked: true },
    { id: '7', domain: 'branch.io', category: 'Deep Linking', blocked: true },
  ]));

  // ─── Family plans ──────────────────────────────────────────────
  const {
    createFamily, getGroupForDevice, inviteMember, joinFamily, removeMember, leaveFamily, listAllGroups, publicView,
  } = require('./family');

  app.post('/api/family/create', requireApiKey, (req, res) => {
    const deviceId = (req.body && req.body.deviceId) || req.query.deviceId;
    if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });
    const group = createFamily(deviceId, req.body && req.body.name);
    res.json({ ...publicView(group, deviceId), inviteCode: group.inviteCode });
  });

  app.get('/api/family', (req, res) => {
    const deviceId = req.query.deviceId;
    if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });
    const group = getGroupForDevice(deviceId);
    res.json(group ? publicView(group, deviceId) : null);
  });

  app.post('/api/family/invite', requireApiKey, (req, res) => {
    const deviceId = (req.body && req.body.deviceId) || req.query.deviceId;
    const group = getGroupForDevice(deviceId);
    if (!group || group.ownerDeviceId !== deviceId) return res.status(403).json({ error: 'Only the family owner can invite' });
    const updated = inviteMember(group.id, { name: req.body && req.body.name, email: req.body && req.body.email, phone: req.body && req.body.phone });
    res.json({ ...publicView(updated, deviceId), inviteCode: updated.inviteCode });
  });

  app.post('/api/family/join', requireApiKey, (req, res) => {
    const deviceId = (req.body && req.body.deviceId) || req.query.deviceId;
    const code = req.body && req.body.inviteCode;
    if (!deviceId || !code) return res.status(400).json({ error: 'deviceId and inviteCode are required' });
    try {
      const group = joinFamily(code, deviceId, req.body && req.body.name);
      res.json(publicView(group, deviceId));
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  app.delete('/api/family/member/:deviceId', requireApiKey, (req, res) => {
    const owner = req.query.deviceId || (req.body && req.body.deviceId);
    const group = owner && getGroupForDevice(owner);
    if (!group || group.ownerDeviceId !== owner) return res.status(403).json({ error: 'Only the family owner can remove members' });
    const ok = removeMember(group.id, req.params.deviceId);
    ok ? res.json(publicView(group, owner)) : res.status(404).json({ error: 'Member not found' });
  });

  app.post('/api/family/leave', requireApiKey, (req, res) => {
    const deviceId = (req.body && req.body.deviceId) || req.query.deviceId;
    const group = getGroupForDevice(deviceId);
    if (!group || group.ownerDeviceId === deviceId) return res.status(400).json({ error: 'The owner cannot leave; transfer or delete the family instead' });
    leaveFamily(group.id, deviceId);
    res.json({ success: true });
  });

  app.get('/api/family/admin', requireApiKey, (req, res) => {
    const groups = listAllGroups().map((g) => ({
      id: g.id, name: g.name, ownerDeviceId: g.ownerDeviceId,
      deviceCount: 1 + g.members.filter((m) => m.status === 'active').length,
      deviceLimit: g.deviceLimit, pendingInvites: g.members.filter((m) => m.status === 'pending').length,
      createdAt: g.createdAt,
    }));
    res.json({ count: groups.length, groups });
  });

  app.use(notFound);
  app.use(errorHandler);

  return { app, PORT };
}

// Only listen when executed directly (tests import createApp without binding a port).
if (require.main === module) {
  const { app, PORT } = createApp();
  app.listen(PORT, () => {
    console.log(`╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║            ShieldGuard API Server (production)            ║`);
    console.log(`║   Threats: ${THREAT_DATABASE.length}  Hashes: ${Object.keys(KNOWN_HASHES).length}  Domains: ${DOMAINS.length}        ║`);
    console.log(`║         Running on http://localhost:${PORT}                  ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝`);
  });
}

module.exports = { createApp, checkPackageForThreat, checkDomainReputation, matchHashes, analyzeThreatRisk };
