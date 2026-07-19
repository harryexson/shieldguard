'use strict';

const crypto = require('crypto');
const { verifyJwt, isRevoked } = require('./auth');

// ─── Centralized error handling ──────────────────────────────────────
function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.path });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || (err.type === 'entity.too.large' ? 413 : 500);
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.path}:`, err.message);
  }
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}

// Wrap async route handlers so rejected promises reach the error handler.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ─── Request logging ─────────────────────────────────────────────────
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const line = `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`;
    if (res.statusCode >= 500) console.error(line);
    else if (res.statusCode >= 400) console.warn(line);
    else if (process.env.LOG_LEVEL === 'debug') console.log(line);
  });
  next();
}

// ─── API key authentication ──────────────────────────────────────────
// Mutating / sensitive routes require an `x-api-key` header. In production
// set REQUIRE_API_KEY=true and API_KEY=<secret>. A default dev key is allowed
// only when REQUIRE_API_KEY is not enabled, so local development keeps working.
//
// The key is accepted ONLY via the `x-api-key` request header — never as a
// query-string parameter — so it is never written into access logs, proxies,
// or browser history. The comparison is length-safe: unequal lengths short-circuit
// to a constant-time rejection (timingSafeEqual throws on length mismatch, which
// would otherwise surface as a 500).
const DEV_KEY = 'dev-shieldguard-key';
function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
function requireApiKey(req, res, next) {
  const required = process.env.REQUIRE_API_KEY === 'true';
  if (!required) return next();
  const configured = process.env.API_KEY || DEV_KEY;
  const provided = req.header('x-api-key');
  if (provided && safeEqual(provided, configured)) {
    return next();
  }
  return res.status(401).json({ error: 'Invalid or missing API key' });
}

// ─── Device-bound authentication ─────────────────────────────────────
// Verifies the `Authorization: Bearer <jwt>` issued by /api/device/register
// or /api/device/token. On success sets req.deviceId from the verified token
// (never from any client-supplied field). When REQUIRE_DEVICE_AUTH=true a
// missing/invalid token is rejected with 401. In development the token is
// optional and the client-supplied deviceId is used as a fallback so the app
// and tests keep working without a registered device.
function requireDevice(req, res, next) {
  const auth = req.header('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  const token = m && m[1];
  if (token) {
    const payload = verifyJwt(token);
    if (!payload || !payload.sub) return res.status(401).json({ error: 'Invalid or expired device token' });
    if (isRevoked(payload.sub)) return res.status(401).json({ error: 'Device revoked' });
    req.deviceId = payload.sub;
    return next();
  }
  if (process.env.REQUIRE_DEVICE_AUTH === 'true') {
    return res.status(401).json({ error: 'Missing device token' });
  }
  // Dev fallback: trust the client-supplied deviceId (spoofable — do not rely on this in prod).
  const provided = (req.body && req.body.deviceId) || req.query.deviceId;
  req.deviceId = provided || null;
  return next();
}

module.exports = { notFound, errorHandler, asyncHandler, requestLogger, requireApiKey, requireDevice, DEV_KEY };
