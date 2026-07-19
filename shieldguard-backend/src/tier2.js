'use strict';

// SQLite-backed Tier-2 stores: client-encrypted backups, last device-security
// scan, and redacted AI reports. Replaces the race-prone JSON file store.

const crypto = require('crypto');
const { getDb } = require('./db');

const BACKUPS_PATH = require('path').join(__dirname, '..', 'data', 'backups.json');
const DEVICE_SECURITY_PATH = require('path').join(__dirname, '..', 'data', 'deviceSecurity.json');
const AI_REPORTS_PATH = require('path').join(__dirname, '..', 'data', 'aiReports.json');

function genId(prefix) { return prefix + crypto.randomBytes(6).toString('hex'); }

const backupStore = {
  exportBackup(deviceId, { ciphertext, name } = {}) {
    const db = getDb();
    const id = genId('bkp_');
    const now = Date.now();
    db.prepare(
      'INSERT INTO backups (id, device_id, name, ciphertext, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, deviceId, name || null, ciphertext, now);
    return { id, name: name || null, createdAt: now };
  },
  getLatest(deviceId) {
    const db = getDb();
    const r = db.prepare('SELECT * FROM backups WHERE device_id = ? ORDER BY created_at DESC LIMIT 1').get(deviceId);
    if (!r) return null;
    return { id: r.id, deviceId: r.device_id, name: r.name, ciphertext: r.ciphertext, createdAt: r.created_at };
  },
};

function safeJson(v) { try { return JSON.stringify(v); } catch { return null; } }
function parseJson(s) { try { return JSON.parse(s); } catch { return s; } }

const deviceSecurityStore = {
  saveScan(deviceId, { posture, details } = {}) {
    const db = getDb();
    const id = genId('sec_');
    const storedAt = Date.now();
    db.prepare(
      'INSERT INTO device_security (id, device_id, posture, details, stored_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, deviceId, posture != null ? safeJson(posture) : null, details != null ? safeJson(details) : null, storedAt);
    return { id, storedAt };
  },
  getScan(deviceId) {
    const db = getDb();
    const r = db.prepare('SELECT * FROM device_security WHERE device_id = ? ORDER BY stored_at DESC LIMIT 1').get(deviceId);
    if (!r) return null;
    return { id: r.id, deviceId: r.device_id, posture: r.posture ? parseJson(r.posture) : null, details: r.details ? parseJson(r.details) : null, storedAt: r.stored_at };
  },
};

const aiReportStore = {
  add(redacted = {}) {
    const db = getDb();
    const record = {
      id: genId('rpt_'),
      deviceId: redacted.deviceId || 'unknown',
      riskLevel: redacted.riskLevel || 'unknown',
      preview: redacted.preview || '',
      provider: redacted.provider || 'rule-based',
      generatedAt: Date.now(),
    };
    db.prepare(
      'INSERT INTO ai_reports (id, device_id, risk_level, preview, provider, generated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(record.id, record.deviceId, record.riskLevel, record.preview, record.provider, record.generatedAt);
    return record;
  },
  aggregate() {
    const db = getDb();
    const all = db.prepare('SELECT * FROM ai_reports').all();
    const byRisk = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const r of all) byRisk[r.risk_level] = (byRisk[r.risk_level] || 0) + 1;
    const recent = all.slice(-50).map((r) => ({
      id: r.id,
      deviceId: r.device_id ? r.device_id.substring(0, 6) : r.device_id,
      riskLevel: r.risk_level,
      preview: r.preview,
      provider: r.provider,
      generatedAt: r.generated_at,
    }));
    return { count: all.length, byRisk, recent };
  },
};

module.exports = { backupStore, deviceSecurityStore, aiReportStore, BACKUPS_PATH, DEVICE_SECURITY_PATH, AI_REPORTS_PATH };
