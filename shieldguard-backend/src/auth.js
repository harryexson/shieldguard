'use strict';

// Device-bound authentication.
//
// The mobile app proves possession of a per-install secret stored in the OS
// secure store (expo-secure-store). On first launch it registers that secret
// with the server and receives a signed, short-lived JWT. Every subsequent
// data-plane request carries `Authorization: Bearer <jwt>`. The server trusts
// the device identity from the verified token (req.deviceId), NOT from any
// client-supplied field — closing the spoofable-deviceId access-control gap.
//
// No user accounts are required (privacy-preserving). The device secret is
// never stored server-side in plaintext; only its SHA-256 hash.

const crypto = require('crypto');
const { getDb } = require('./db');

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secretForSigning() {
  return process.env.DEVICE_JWT_SECRET || process.env.AUTH_SECRET || 'dev-device-secret-change-me';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlJson(obj) {
  return b64url(Buffer.from(JSON.stringify(obj)));
}
function fromB64url(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
}

function signJwt(payload, ttl = TOKEN_TTL_SECONDS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttl,
  };
  const h = b64urlJson(header);
  const b = b64urlJson(body);
  const sig = b64url(crypto.createHmac('sha256', secretForSigning()).update(`${h}.${b}`).digest());
  return `${h}.${b}.${sig}`;
}

function verifyJwt(token) {
  if (typeof token !== 'string' || token.split('.').length !== 3) return null;
  const [h, b, sig] = token.split('.');
  const expected = b64url(crypto.createHmac('sha256', secretForSigning()).update(`${h}.${b}`).digest());
  const a = Buffer.from(sig);
  const c = Buffer.from(expected);
  if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) return null;
  let body;
  try { body = JSON.parse(fromB64url(b)); } catch (_) { return null; }
  if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
  return body;
}

// ─── Device record persistence ──────────────────────────────────────
function hashSecret(secret) {
  return crypto.createHash('sha256').update(`shieldguard-device::${secret}`).digest('hex');
}

function findDevice(deviceId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(deviceId);
  return row || null;
}

function createDevice(deviceId, secret) {
  const db = getDb();
  const id = `dev_${crypto.randomBytes(10).toString('hex')}`;
  const finalId = deviceId || id;
  db.prepare(
    'INSERT INTO devices (id, device_id, secret_hash, created_at, revoked) VALUES (?, ?, ?, ?, 0)'
  ).run(finalId, finalId, hashSecret(secret), Date.now());
  return finalId;
}

function verifyDeviceSecret(deviceId, secret) {
  const row = findDevice(deviceId);
  if (!row) return false;
  if (row.revoked) return false;
  const a = Buffer.from(hashSecret(secret));
  const b = Buffer.from(row.secret_hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isRevoked(deviceId) {
  const row = findDevice(deviceId);
  return !row || row.revoked === 1;
}

function revokeDevice(deviceId) {
  const db = getDb();
  const res = db.prepare('UPDATE devices SET revoked = 1 WHERE device_id = ?').run(deviceId);
  return res.changes > 0;
}

function issueToken(deviceId) {
  return signJwt({ sub: deviceId, jti: crypto.randomBytes(8).toString('hex') });
}

// ─── Registration / token endpoints ─────────────────────────────────
function registerDevice(body = {}) {
  const { deviceId, deviceSecret } = body;
  if (!deviceSecret || typeof deviceSecret !== 'string' || deviceSecret.length < 16) {
    const e = new Error('deviceSecret must be a string of at least 16 characters');
    e.status = 400;
    throw e;
  }
  if (deviceId) {
    const existing = findDevice(deviceId);
    if (existing) {
      if (!verifyDeviceSecret(deviceId, deviceSecret)) {
        const e = new Error('Device already registered with a different secret');
        e.status = 401;
        throw e;
      }
      return { deviceId, token: issueToken(deviceId), existing: true };
    }
  }
  const newId = createDevice(deviceId, deviceSecret);
  return { deviceId: newId, token: issueToken(newId), existing: false };
}

function exchangeToken(body = {}) {
  const { deviceId, deviceSecret } = body;
  if (!deviceId || !deviceSecret) {
    const e = new Error('deviceId and deviceSecret are required');
    e.status = 400;
    throw e;
  }
  if (!verifyDeviceSecret(deviceId, deviceSecret)) {
    const e = new Error('Invalid device credentials');
    e.status = 401;
    throw e;
  }
  return { deviceId, token: issueToken(deviceId) };
}

module.exports = {
  signJwt,
  verifyJwt,
  registerDevice,
  exchangeToken,
  revokeDevice,
  isRevoked,
  findDevice,
  TOKEN_TTL_SECONDS,
};
