'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUPS_PATH = path.join(DATA_DIR, 'backups.json');
const DEVICE_SECURITY_PATH = path.join(DATA_DIR, 'deviceSecurity.json');
const AI_REPORTS_PATH = path.join(DATA_DIR, 'aiReports.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function load(p) {
  ensureDir();
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (_) {
    /* corrupted — start fresh */
  }
  return { items: {} };
}
function save(p, db) {
  ensureDir();
  fs.writeFileSync(p, JSON.stringify(db, null, 2), 'utf-8');
}

function genId(prefix) { return prefix + crypto.randomBytes(6).toString('hex'); }

// ─── Backup store (client-encrypted ciphertext only) ──────────────────
const backupStore = {
  exportBackup(deviceId, { ciphertext, name } = {}) {
    const db = load(BACKUPS_PATH);
    const id = genId('bkp_');
    const now = Date.now();
    const record = { id, deviceId, name: name || null, ciphertext, createdAt: now };
    db.items[deviceId] = record;
    save(BACKUPS_PATH, db);
    return { id, name: record.name, createdAt: now };
  },
  getLatest(deviceId) {
    const db = load(BACKUPS_PATH);
    return db.items[deviceId] || null;
  },
};

// ─── Device security scan store (latest per device) ───────────────────
const deviceSecurityStore = {
  saveScan(deviceId, { posture, details } = {}) {
    const db = load(DEVICE_SECURITY_PATH);
    const id = genId('sec_');
    const storedAt = Date.now();
    const record = { id, deviceId, posture: posture || null, details: details || null, storedAt };
    db.items[deviceId] = record;
    save(DEVICE_SECURITY_PATH, db);
    return { id, storedAt };
  },
  getScan(deviceId) {
    const db = load(DEVICE_SECURITY_PATH);
    return db.items[deviceId] || null;
  },
};

// ─── AI report store (redacted summaries only) ───────────────────────
const aiReportStore = {
  add(redacted = {}) {
    const db = load(AI_REPORTS_PATH);
    const record = {
      id: genId('rpt_'),
      deviceId: redacted.deviceId || 'unknown',
      riskLevel: redacted.riskLevel || 'unknown',
      preview: redacted.preview || '',
      provider: redacted.provider || 'rule-based',
      generatedAt: Date.now(),
    };
    db.items[record.id] = record;
    save(AI_REPORTS_PATH, db);
    return record;
  },
  aggregate() {
    const db = load(AI_REPORTS_PATH);
    const all = Object.values(db.items);
    const byRisk = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const r of all) byRisk[r.riskLevel] = (byRisk[r.riskLevel] || 0) + 1;
    const recent = all.slice(-50).map((r) => ({
      id: r.id,
      deviceId: r.deviceId ? r.deviceId.substring(0, 6) : r.deviceId,
      riskLevel: r.riskLevel,
      preview: r.preview,
      provider: r.provider,
      generatedAt: r.generatedAt,
    }));
    return { count: all.length, byRisk, recent };
  },
};

module.exports = {
  backupStore,
  deviceSecurityStore,
  aiReportStore,
  BACKUPS_PATH,
  DEVICE_SECURITY_PATH,
  AI_REPORTS_PATH,
};
