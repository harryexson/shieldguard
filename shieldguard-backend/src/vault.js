'use strict';

// SQLite-backed vault / decoy / password / share / incident stores.
// Replaces the previous JSON-file store (race-prone, last-writer-wins).
// The exported object shapes (vaultStore, decoyStore, passwordStore,
// shareStore, incidentStore) and method names are unchanged so callers and
// tests keep working. The *PATH constants are retained only for backward
// compatibility (the tests unlink them in beforeAll — a no-op now).

const crypto = require('crypto');
const { getDb } = require('./db');

const DATA_DIR = require('path').join(__dirname, '..', 'data');
const VAULT_PATH = require('path').join(DATA_DIR, 'vault.json');
const DECOY_PATH = require('path').join(DATA_DIR, 'decoy.json');
const PASSWORDS_PATH = require('path').join(DATA_DIR, 'passwords.json');
const SHARE_PATH = require('path').join(DATA_DIR, 'share.json');
const INCIDENTS_PATH = require('path').join(DATA_DIR, 'incidents.json');

function genId(prefix) { return prefix + crypto.randomBytes(6).toString('hex'); }

// ─── Vault & Decoy stores (same table, separated by `store` column) ──────
function buildItemStore(store) {
  return {
    addItem(deviceId, item) {
      const db = getDb();
      const id = genId('vlt_');
      const now = Date.now();
      db.prepare(
        `INSERT INTO vault_items (id, store, device_id, folder, name, mime_type, kind, favorite, payload, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id, store, deviceId,
        item.folder || 'General',
        item.name || 'Untitled',
        item.mimeType || 'application/octet-stream',
        item.kind || 'file',
        item.favorite ? 1 : 0,
        item.payload,
        now, now
      );
      return { id, deviceId, createdAt: now, updatedAt: now };
    },
    listItems(deviceId) {
      const db = getDb();
      const rows = db.prepare(
        `SELECT id, device_id, folder, name, mime_type, kind, favorite, created_at, updated_at
         FROM vault_items WHERE device_id = ? AND store = ? ORDER BY created_at DESC`
      ).all(deviceId, store);
      return rows.map((r) => ({
        id: r.id, deviceId: r.device_id, folder: r.folder, name: r.name,
        mimeType: r.mime_type, kind: r.kind, favorite: !!r.favorite,
        createdAt: r.created_at, updatedAt: r.updated_at,
      }));
    },
    getItem(deviceId, id) {
      const db = getDb();
      const r = db.prepare('SELECT * FROM vault_items WHERE id = ? AND device_id = ? AND store = ?').get(id, deviceId, store);
      return r ? { ...r, favorite: !!r.favorite } : null;
    },
    updateItem(deviceId, id, patch) {
      const db = getDb();
      const existing = db.prepare('SELECT * FROM vault_items WHERE id = ? AND device_id = ? AND store = ?').get(id, deviceId, store);
      if (!existing) return null;
      const fields = ['folder', 'name', 'mime_type', 'kind', 'favorite', 'payload'];
      for (const f of fields) {
        if (f in patch) existing[f === 'favorite' ? 'favorite' : f] = f === 'favorite' ? (patch[f] ? 1 : 0) : patch[f];
      }
      existing.updated_at = Date.now();
      db.prepare(
        `UPDATE vault_items SET folder=?, name=?, mime_type=?, kind=?, favorite=?, payload=?, updated_at=?
         WHERE id=? AND device_id=? AND store=?`
      ).run(
        existing.folder, existing.name, existing.mime_type, existing.kind,
        existing.favorite ? 1 : 0, existing.payload, existing.updated_at, id, deviceId, store
      );
      return {
        id: existing.id, deviceId: existing.device_id, folder: existing.folder, name: existing.name,
        mimeType: existing.mime_type, kind: existing.kind, favorite: !!existing.favorite,
        createdAt: existing.created_at, updatedAt: existing.updated_at,
      };
    },
    removeItem(deviceId, id) {
      const db = getDb();
      const res = db.prepare('DELETE FROM vault_items WHERE id = ? AND device_id = ? AND store = ?').run(id, deviceId, store);
      return res.changes > 0;
    },
  };
}

const vaultStore = buildItemStore('real');
const decoyStore = buildItemStore('decoy');

// ─── Password store ──────────────────────────────────────────────────
const passwordStore = {
  addEntry(deviceId, entry) {
    const db = getDb();
    const id = genId('pwd_');
    const now = Date.now();
    db.prepare(
      `INSERT INTO passwords (id, device_id, name, username, site_url, strength, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, deviceId, entry.name || 'Unnamed', entry.username || null, entry.siteUrl || null,
      typeof entry.strength === 'number' ? entry.strength : null, entry.payload, now
    );
    return { id, createdAt: now };
  },
  listEntries(deviceId) {
    const db = getDb();
    const rows = db.prepare(
      'SELECT id, device_id, name, username, site_url, strength, created_at FROM passwords WHERE device_id = ? ORDER BY created_at DESC'
    ).all(deviceId);
    return rows.map((r) => ({
      id: r.id, deviceId: r.device_id, name: r.name, username: r.username,
      siteUrl: r.site_url, strength: r.strength, createdAt: r.created_at,
    }));
  },
  getEntry(deviceId, id) {
    const db = getDb();
    const r = db.prepare('SELECT * FROM passwords WHERE id = ? AND device_id = ?').get(id, deviceId);
    return r ? { ...r } : null;
  },
  removeEntry(deviceId, id) {
    const db = getDb();
    const res = db.prepare('DELETE FROM passwords WHERE id = ? AND device_id = ?').run(id, deviceId);
    return res.changes > 0;
  },
};

// ─── Share store (token-scoped, not device-scoped) ───────────────────
const shareStore = {
  createShare({ payload, iv, name, mimeType, maxViews = 1, ttlSeconds = 86400 } = {}) {
    const db = getDb();
    const token = 'sh_' + crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    db.prepare(
      `INSERT INTO shares (token, payload, iv, name, mime_type, max_views, views_remaining, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(token, payload, iv || null, name || null, mimeType || 'application/octet-stream', maxViews, maxViews, now + ttlSeconds * 1000, now);
    return { token, payload, iv, name, mimeType, maxViews, viewsRemaining: maxViews, expiresAt: now + ttlSeconds * 1000, createdAt: now };
  },
  getShare(token) {
    const db = getDb();
    const rec = db.prepare('SELECT * FROM shares WHERE token = ?').get(token);
    if (!rec) return null;
    const now = Date.now();
    if (now > rec.expires_at || rec.views_remaining <= 0) {
      db.prepare('DELETE FROM shares WHERE token = ?').run(token);
      return null;
    }
    rec.views_remaining -= 1;
    const row = { ...rec };
    if (row.views_remaining <= 0) db.prepare('DELETE FROM shares WHERE token = ?').run(token);
    else db.prepare('UPDATE shares SET views_remaining = ? WHERE token = ?').run(row.views_remaining, token);
    return {
      token: row.token,
      payload: row.payload,
      iv: row.iv,
      name: row.name,
      mimeType: row.mime_type,
      maxViews: row.max_views,
      viewsRemaining: row.views_remaining,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  },
  purgeExpired() {
    const db = getDb();
    db.prepare('DELETE FROM shares WHERE expires_at <= ? OR views_remaining <= 0').run(Date.now());
  },
};

// ─── Incident store ──────────────────────────────────────────────────
const VALID_TYPES = ['panic', 'duress', 'sos'];
const incidentStore = {
  addIncident(deviceId, { type, location, battery, note, metadata } = {}) {
    const db = getDb();
    if (!VALID_TYPES.includes(type)) {
      const e = new Error('Invalid incident type'); e.status = 400; throw e;
    }
    const id = genId('inc_');
    const now = Date.now();
    db.prepare(
      `INSERT INTO incidents (id, device_id, type, location, battery, note, metadata, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`
    ).run(id, deviceId, type,
      location ? JSON.stringify(location) : null,
      typeof battery === 'number' ? battery : null,
      note || null,
      metadata ? JSON.stringify(metadata) : null,
      now);
    return { id, type, status: 'open', createdAt: now };
  },
  listIncidents(deviceId) {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM incidents WHERE device_id = ? ORDER BY created_at DESC').all(deviceId);
    return rows.map(normalizeIncident);
  },
  resolveIncident(id, resolution) {
    const db = getDb();
    const inc = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
    if (!inc) return null;
    db.prepare("UPDATE incidents SET status='resolved', resolution=?, resolved_at=? WHERE id=?")
      .run(resolution || null, Date.now(), id);
    return normalizeIncident(db.prepare('SELECT * FROM incidents WHERE id = ?').get(id));
  },
  listAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM incidents ORDER BY created_at DESC').all().map(normalizeIncident);
  },
};

function normalizeIncident(r) {
  if (!r) return r;
  return {
    id: r.id, deviceId: r.device_id, type: r.type,
    location: r.location ? safeJson(r.location) : null,
    battery: r.battery, note: r.note,
    metadata: r.metadata ? safeJson(r.metadata) : null,
    status: r.status, createdAt: r.created_at, resolvedAt: r.resolved_at, resolution: r.resolution,
  };
}
function safeJson(s) { try { return JSON.parse(s); } catch { return s; } }

module.exports = {
  vaultStore,
  decoyStore,
  passwordStore,
  shareStore,
  incidentStore,
  VAULT_PATH,
  DECOY_PATH,
  PASSWORDS_PATH,
  SHARE_PATH,
  INCIDENTS_PATH,
};
