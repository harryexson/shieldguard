'use strict';

// SQLite-backed persistence layer (Node 24 built-in `node:sqlite`).
// Replaces the previous JSON-file stores, which were race-prone
// (synchronous full-file rewrite per request, last-writer-wins).
//
// A single connection is shared per process. In tests we run with
// SHIELDGUARD_DB_PATH=:memory: (see tests/setup.js) so each jest worker
// gets an isolated database.

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.SHIELDGUARD_DB_PATH || path.join(DATA_DIR, 'shieldguard.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS devices (
  id          TEXT PRIMARY KEY,
  device_id   TEXT UNIQUE NOT NULL,
  secret_hash TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  revoked     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS vault_items (
  id          TEXT PRIMARY KEY,
  store       TEXT NOT NULL DEFAULT 'real',
  device_id   TEXT NOT NULL,
  folder      TEXT NOT NULL DEFAULT 'General',
  name        TEXT NOT NULL DEFAULT 'Untitled',
  mime_type   TEXT NOT NULL DEFAULT 'application/octet-stream',
  kind        TEXT NOT NULL DEFAULT 'file',
  favorite    INTEGER NOT NULL DEFAULT 0,
  payload     TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vault_device ON vault_items(device_id, store);

CREATE TABLE IF NOT EXISTS passwords (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT 'Unnamed',
  username    TEXT,
  site_url    TEXT,
  strength    INTEGER,
  payload     TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pw_device ON passwords(device_id);

CREATE TABLE IF NOT EXISTS shares (
  token         TEXT PRIMARY KEY,
  payload       TEXT,
  iv            TEXT,
  name          TEXT,
  mime_type     TEXT,
  max_views     INTEGER,
  views_remaining INTEGER,
  expires_at    INTEGER,
  created_at    INTEGER
);

CREATE TABLE IF NOT EXISTS incidents (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL,
  type        TEXT NOT NULL,
  location    TEXT,
  battery     INTEGER,
  note        TEXT,
  metadata    TEXT,
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  INTEGER NOT NULL,
  resolved_at INTEGER,
  resolution  TEXT
);
CREATE INDEX IF NOT EXISTS idx_incident_device ON incidents(device_id);

CREATE TABLE IF NOT EXISTS backups (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL,
  name        TEXT,
  ciphertext  TEXT,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_backup_device ON backups(device_id);

CREATE TABLE IF NOT EXISTS device_security (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL,
  posture     TEXT,
  details     TEXT,
  stored_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL,
  channel     TEXT NOT NULL,
  ciphertext  TEXT,
  kind        TEXT,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_channel ON sync(channel);

CREATE TABLE IF NOT EXISTS commands (
  id              TEXT PRIMARY KEY,
  owner_device_id TEXT NOT NULL,
  target_device_id TEXT NOT NULL,
  type            TEXT NOT NULL,
  payload         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cmd_target ON commands(target_device_id, status);

CREATE TABLE IF NOT EXISTS audit (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL,
  type        TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_device ON audit(device_id);

CREATE TABLE IF NOT EXISTS ai_reports (
  id          TEXT PRIMARY KEY,
  risk_level  TEXT,
  preview     TEXT,
  provider    TEXT,
  device_id   TEXT,
  generated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  device_id   TEXT PRIMARY KEY,
  tier        TEXT NOT NULL,
  plan        TEXT NOT NULL,
  status      TEXT NOT NULL,
  since       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS families (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL DEFAULT 'My Family',
  owner_device_id TEXT NOT NULL,
  invite_code   TEXT NOT NULL,
  device_limit  INTEGER NOT NULL DEFAULT 5,
  created_at    INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS family_members (
  id          TEXT PRIMARY KEY,
  group_id    TEXT NOT NULL,
  device_id   TEXT,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  status      TEXT NOT NULL,
  invited_at  INTEGER,
  joined_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_family_owner ON families(owner_device_id);
CREATE INDEX IF NOT EXISTS idx_family_code ON families(invite_code);
`;

let _db = null;

function getDb() {
  if (_db) return _db;
  if (DB_PATH !== ':memory:' && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  _db = new DatabaseSync(DB_PATH);
  _db.exec('PRAGMA journal_mode = WAL;');
  _db.exec('PRAGMA busy_timeout = 5000;');
  initSchema(_db);
  return _db;
}

function initSchema(db = getDb()) {
  db.exec(SCHEMA);
}

// Used by tests to start from a clean slate.
function resetDb(db = getDb()) {
  const tables = [
    'ai_reports', 'audit', 'commands', 'sync', 'device_security', 'backups',
    'incidents', 'shares', 'passwords', 'vault_items', 'subscriptions',
    'family_members', 'families', 'devices',
  ];
  for (const t of tables) {
    try { db.exec(`DROP TABLE IF EXISTS ${t};`); } catch (_) { /* ignore */ }
  }
  initSchema(db);
}

module.exports = { getDb, initSchema, resetDb, DB_PATH, SCHEMA };
