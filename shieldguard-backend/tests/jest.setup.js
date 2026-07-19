'use strict';

// Runs before any test file is required. Forces an isolated, in-memory
// database and clears leftover JSON state from previous runs so the
// SQLite migration is exercised from a clean slate.

const fs = require('fs');
const path = require('path');

process.env.SHIELDGUARD_DB_PATH = ':memory:';

const DATA_DIR = path.join(__dirname, '..', 'data');
if (fs.existsSync(DATA_DIR)) {
  for (const f of fs.readdirSync(DATA_DIR)) {
    try { fs.rmSync(path.join(DATA_DIR, f), { recursive: true, force: true }); } catch (_) {}
  }
}
