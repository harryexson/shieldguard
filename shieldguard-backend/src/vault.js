'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const VAULT_PATH = path.join(DATA_DIR, 'vault.json');
const DECOY_PATH = path.join(DATA_DIR, 'decoy.json');
const PASSWORDS_PATH = path.join(DATA_DIR, 'passwords.json');
const SHARE_PATH = path.join(DATA_DIR, 'share.json');
const INCIDENTS_PATH = path.join(DATA_DIR, 'incidents.json');

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

// ─── Vault & Decoy stores ────────────────────────────────────────────
function buildItemStore(filePath) {
  return {
    addItem(deviceId, item) {
      const db = load(filePath);
      const id = genId('vlt_');
      const now = Date.now();
      const record = {
        id,
        deviceId,
        folder: item.folder || 'General',
        name: item.name || 'Untitled',
        mimeType: item.mimeType || 'application/octet-stream',
        kind: item.kind || 'file',
        favorite: Boolean(item.favorite),
        payload: item.payload,
        createdAt: now,
        updatedAt: now,
      };
      db.items[id] = record;
      save(filePath, db);
      return record;
    },
    listItems(deviceId) {
      const db = load(filePath);
      return Object.values(db.items)
        .filter((i) => i.deviceId === deviceId)
        .map(({ id, deviceId: d, folder, name, mimeType, kind, favorite, createdAt, updatedAt }) =>
          ({ id, deviceId: d, folder, name, mimeType, kind, favorite, createdAt, updatedAt }));
    },
    getItem(deviceId, id) {
      const db = load(filePath);
      const item = db.items[id];
      if (!item || item.deviceId !== deviceId) return null;
      return item;
    },
    updateItem(deviceId, id, patch) {
      const db = load(filePath);
      const item = db.items[id];
      if (!item || item.deviceId !== deviceId) return null;
      const fields = ['folder', 'name', 'mimeType', 'kind', 'favorite', 'payload'];
      for (const f of fields) {
        if (f in patch) item[f] = f === 'favorite' ? Boolean(patch[f]) : patch[f];
      }
      item.updatedAt = Date.now();
      db.items[id] = item;
      save(filePath, db);
      return {
        id: item.id,
        deviceId: item.deviceId,
        folder: item.folder,
        name: item.name,
        mimeType: item.mimeType,
        kind: item.kind,
        favorite: item.favorite,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    },
    removeItem(deviceId, id) {
      const db = load(filePath);
      const item = db.items[id];
      if (!item || item.deviceId !== deviceId) return false;
      delete db.items[id];
      save(filePath, db);
      return true;
    },
  };
}

const vaultStore = buildItemStore(VAULT_PATH);
const decoyStore = buildItemStore(DECOY_PATH);

// ─── Password store ──────────────────────────────────────────────────
const passwordStore = {
  addEntry(deviceId, entry) {
    const db = load(PASSWORDS_PATH);
    const id = genId('pwd_');
    const record = {
      id,
      deviceId,
      name: entry.name || 'Unnamed',
      username: entry.username || null,
      siteUrl: entry.siteUrl || null,
      strength: typeof entry.strength === 'number' ? entry.strength : null,
      payload: entry.payload,
      createdAt: Date.now(),
    };
    db.items[id] = record;
    save(PASSWORDS_PATH, db);
    return record;
  },
  listEntries(deviceId) {
    const db = load(PASSWORDS_PATH);
    return Object.values(db.items)
      .filter((e) => e.deviceId === deviceId)
      .map(({ id, deviceId: d, name, username, siteUrl, strength, createdAt }) =>
        ({ id, deviceId: d, name, username, siteUrl, strength, createdAt }));
  },
  getEntry(deviceId, id) {
    const db = load(PASSWORDS_PATH);
    const entry = db.items[id];
    if (!entry || entry.deviceId !== deviceId) return null;
    return entry;
  },
  removeEntry(deviceId, id) {
    const db = load(PASSWORDS_PATH);
    const entry = db.items[id];
    if (!entry || entry.deviceId !== deviceId) return false;
    delete db.items[id];
    save(PASSWORDS_PATH, db);
    return true;
  },
};

// ─── Share store (token-scoped, not device-scoped) ───────────────────
const shareStore = {
  createShare({ payload, iv, name, mimeType, maxViews = 1, ttlSeconds = 86400 } = {}) {
    const db = load(SHARE_PATH);
    const token = 'sh_' + crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const record = {
      token,
      payload,
      iv: iv || null,
      name: name || null,
      mimeType: mimeType || 'application/octet-stream',
      maxViews,
      viewsRemaining: maxViews,
      expiresAt: now + ttlSeconds * 1000,
      createdAt: now,
    };
    db.items[token] = record;
    save(SHARE_PATH, db);
    return record;
  },
  getShare(token) {
    const db = load(SHARE_PATH);
    const rec = db.items[token];
    if (!rec) return null;
    const now = Date.now();
    if (now > rec.expiresAt || rec.viewsRemaining <= 0) {
      delete db.items[token];
      save(SHARE_PATH, db);
      return null;
    }
    rec.viewsRemaining -= 1;
    const result = { ...rec };
    if (rec.viewsRemaining <= 0) delete db.items[token];
    else db.items[token] = rec;
    save(SHARE_PATH, db);
    return result;
  },
  purgeExpired() {
    const db = load(SHARE_PATH);
    const now = Date.now();
    let changed = false;
    for (const token of Object.keys(db.items)) {
      const rec = db.items[token];
      if (now > rec.expiresAt || rec.viewsRemaining <= 0) {
        delete db.items[token];
        changed = true;
      }
    }
    if (changed) save(SHARE_PATH, db);
  },
};

// ─── Incident store ──────────────────────────────────────────────────
const VALID_TYPES = ['panic', 'duress', 'sos'];
const incidentStore = {
  addIncident(deviceId, { type, location, battery, note, metadata } = {}) {
    const db = load(INCIDENTS_PATH);
    if (!VALID_TYPES.includes(type)) {
      const e = new Error('Invalid incident type'); e.status = 400; throw e;
    }
    const id = genId('inc_');
    const record = {
      id,
      deviceId,
      type,
      location: location || null,
      battery: typeof battery === 'number' ? battery : null,
      note: note || null,
      metadata: metadata || null,
      status: 'open',
      createdAt: Date.now(),
      resolvedAt: null,
    };
    db.items[id] = record;
    save(INCIDENTS_PATH, db);
    return record;
  },
  listIncidents(deviceId) {
    const db = load(INCIDENTS_PATH);
    return Object.values(db.items).filter((i) => i.deviceId === deviceId);
  },
  resolveIncident(id, resolution) {
    const db = load(INCIDENTS_PATH);
    const inc = db.items[id];
    if (!inc) return null;
    inc.status = 'resolved';
    inc.resolution = resolution || null;
    inc.resolvedAt = Date.now();
    db.items[id] = inc;
    save(INCIDENTS_PATH, db);
    return inc;
  },
  listAll() {
    const db = load(INCIDENTS_PATH);
    return Object.values(db.items);
  },
};

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
