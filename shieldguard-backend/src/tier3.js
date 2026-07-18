'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SYNC_PATH = path.join(DATA_DIR, 'sync.json');
const COMMANDS_PATH = path.join(DATA_DIR, 'commands.json');
const AUDIT_PATH = path.join(DATA_DIR, 'audit.json');

const ADMIN_OWNER = '<admin>';
const VALID_COMMAND_TYPES = ['wipe', 'lock', 'notify'];

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

// ─── Sync store (client-encrypted ciphertext only) ──────────────────
// The server NEVER decrypts. It relays opaque blobs between devices on a
// shared channel. This is a simplified shared-key model, not Signal-grade.
const syncStore = {
  push(deviceId, { channel, ciphertext, kind } = {}) {
    const db = load(SYNC_PATH);
    const id = genId('syn_');
    const updatedAt = Date.now();
    const record = { id, deviceId, channel, ciphertext, kind: kind || null, updatedAt };
    db.items[id] = record;
    save(SYNC_PATH, db);
    return { id, updatedAt };
  },
  pull(channel, sinceMs) {
    const db = load(SYNC_PATH);
    const since = sinceMs || 0;
    return Object.values(db.items)
      .filter((r) => r.channel === channel && r.updatedAt > since)
      .map(({ id, deviceId, channel, ciphertext, kind, updatedAt }) =>
        ({ id, deviceId, channel, ciphertext, kind, updatedAt }));
  },
};

// ─── Command store (remote device management) ───────────────────────
// Stores ONLY the instruction + target deviceId. The server never sees
// secrets; the target device performs the (best-effort) action locally.
const commandStore = {
  _create(ownerDeviceId, targetDeviceId, type, payload) {
    const db = load(COMMANDS_PATH);
    const id = genId('cmd_');
    const createdAt = Date.now();
    const record = {
      id,
      ownerDeviceId,
      targetDeviceId,
      type,
      payload: payload || null,
      status: 'pending',
      createdAt,
    };
    db.items[id] = record;
    save(COMMANDS_PATH, db);
    return record;
  },
  issue(ownerDeviceId, targetDeviceId, type, payload) {
    if (!VALID_COMMAND_TYPES.includes(type)) {
      const e = new Error('Invalid command type'); e.status = 400; throw e;
    }
    if (ownerDeviceId === ADMIN_OWNER) {
      return this._create(ADMIN_OWNER, targetDeviceId, type, payload);
    }
    const { getGroupForDevice } = require('./family');
    const group = getGroupForDevice(ownerDeviceId);
    const targetGroup = getGroupForDevice(targetDeviceId);
    if (!group || group.ownerDeviceId !== ownerDeviceId || !targetGroup || targetGroup.id !== group.id) {
      const e = new Error('Only the family owner can issue commands to members');
      e.status = 403;
      throw e;
    }
    return this._create(ownerDeviceId, targetDeviceId, type, payload);
  },
  issueAdmin(targetDeviceId, type, payload) {
    if (!VALID_COMMAND_TYPES.includes(type)) {
      const e = new Error('Invalid command type'); e.status = 400; throw e;
    }
    return this._create(ADMIN_OWNER, targetDeviceId, type, payload);
  },
  pendingFor(deviceId) {
    const db = load(COMMANDS_PATH);
    return Object.values(db.items)
      .filter((c) => c.targetDeviceId === deviceId && c.status === 'pending');
  },
  ack(id, deviceId) {
    const db = load(COMMANDS_PATH);
    const cmd = db.items[id];
    if (!cmd || cmd.targetDeviceId !== deviceId) return null;
    cmd.status = 'acked';
    db.items[id] = cmd;
    save(COMMANDS_PATH, db);
    return cmd;
  },
};

// ─── Audit store (REDACTED: type + deviceId + timestamp only) ───────
const auditStore = {
  append(deviceId, type) {
    const db = load(AUDIT_PATH);
    const record = {
      id: genId('aud_'),
      deviceId,
      type: typeof type === 'string' ? type : 'unknown',
      at: Date.now(),
    };
    // Intentionally drops any other fields/PII passed in.
    db.items[record.id] = record;
    save(AUDIT_PATH, db);
    return { id: record.id, deviceId: record.deviceId, type: record.type, at: record.at };
  },
  list(deviceId) {
    const db = load(AUDIT_PATH);
    return Object.values(db.items)
      .filter((e) => e.deviceId === deviceId)
      .sort((a, b) => b.at - a.at);
  },
  aggregate() {
    const db = load(AUDIT_PATH);
    const all = Object.values(db.items);
    const byType = {};
    for (const e of all) byType[e.type] = (byType[e.type] || 0) + 1;
    const recent = all
      .sort((a, b) => b.at - a.at)
      .slice(0, 50)
      .map((e) => ({
        id: e.id,
        deviceId: e.deviceId ? e.deviceId.substring(0, 6) : e.deviceId,
        type: e.type,
        at: e.at,
      }));
    return { count: all.length, byType, recent };
  },
};

module.exports = {
  syncStore,
  commandStore,
  auditStore,
  SYNC_PATH,
  COMMANDS_PATH,
  AUDIT_PATH,
};
