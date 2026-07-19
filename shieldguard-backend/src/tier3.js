'use strict';

// SQLite-backed Tier-3 stores: shared-key sync, remote device commands, and a
// REDACTED audit log (type + deviceId + timestamp only). Replaces JSON files.

const crypto = require('crypto');
const { getDb } = require('./db');

const SYNC_PATH = require('path').join(__dirname, '..', 'data', 'sync.json');
const COMMANDS_PATH = require('path').join(__dirname, '..', 'data', 'commands.json');
const AUDIT_PATH = require('path').join(__dirname, '..', 'data', 'audit.json');

const ADMIN_OWNER = '<admin>';
const VALID_COMMAND_TYPES = ['wipe', 'lock', 'notify'];

function genId(prefix) { return prefix + crypto.randomBytes(6).toString('hex'); }

const syncStore = {
  push(deviceId, { channel, ciphertext, kind } = {}) {
    const db = getDb();
    const id = genId('syn_');
    const updatedAt = Date.now();
    db.prepare(
      'INSERT INTO sync (id, device_id, channel, ciphertext, kind, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, deviceId, channel, ciphertext, kind || null, updatedAt);
    return { id, updatedAt };
  },
  pull(channel, sinceMs) {
    const db = getDb();
    const since = sinceMs || 0;
    const rows = db.prepare(
      'SELECT * FROM sync WHERE channel = ? AND updated_at > ? ORDER BY updated_at ASC'
    ).all(channel, since);
    return rows.map((r) => ({
      id: r.id, deviceId: r.device_id, channel: r.channel,
      ciphertext: r.ciphertext, kind: r.kind, updatedAt: r.updated_at,
    }));
  },
};

const commandStore = {
  _create(ownerDeviceId, targetDeviceId, type, payload) {
    const db = getDb();
    const id = genId('cmd_');
    const createdAt = Date.now();
    db.prepare(
      'INSERT INTO commands (id, owner_device_id, target_device_id, type, payload, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, ownerDeviceId, targetDeviceId, type, payload || null, 'pending', createdAt);
    return {
      id, ownerDeviceId, targetDeviceId, type,
      payload: payload || null, status: 'pending', createdAt,
    };
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
    const db = getDb();
    return db.prepare("SELECT * FROM commands WHERE target_device_id = ? AND status = 'pending'").all(deviceId);
  },
  ack(id, deviceId) {
    const db = getDb();
    const cmd = db.prepare('SELECT * FROM commands WHERE id = ?').get(id);
    if (!cmd || cmd.target_device_id !== deviceId) return null;
    db.prepare("UPDATE commands SET status = 'acked' WHERE id = ?").run(id);
    return db.prepare('SELECT * FROM commands WHERE id = ?').get(id);
  },
};

const auditStore = {
  append(deviceId, type) {
    const db = getDb();
    const id = genId('aud_');
    const at = Date.now();
    // Intentionally drops any other fields/PII passed in; stores type + deviceId + timestamp only.
    const safeType = typeof type === 'string' ? type : 'unknown';
    db.prepare('INSERT INTO audit (id, device_id, type, created_at) VALUES (?, ?, ?, ?)').run(id, deviceId, safeType, at);
    return { id, deviceId, type: safeType, at };
  },
  list(deviceId) {
    const db = getDb();
    return db.prepare('SELECT * FROM audit WHERE device_id = ? ORDER BY created_at DESC').all(deviceId)
      .map((r) => ({ id: r.id, deviceId: r.device_id, type: r.type, at: r.created_at }));
  },
  aggregate() {
    const db = getDb();
    const all = db.prepare('SELECT * FROM audit').all();
    const byType = {};
    for (const e of all) byType[e.type] = (byType[e.type] || 0) + 1;
    const recent = all
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 50)
      .map((e) => ({
        id: e.id,
        deviceId: e.device_id ? e.device_id.substring(0, 6) : e.device_id,
        type: e.type,
        at: e.created_at,
      }));
    return { count: all.length, byType, recent };
  },
};

module.exports = { syncStore, commandStore, auditStore, SYNC_PATH, COMMANDS_PATH, AUDIT_PATH };
