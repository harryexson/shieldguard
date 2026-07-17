'use strict';

const crypto = require('crypto');

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
const DEV_KEY = 'dev-shieldguard-key';
function requireApiKey(req, res, next) {
  const required = process.env.REQUIRE_API_KEY === 'true';
  const configured = process.env.API_KEY || DEV_KEY;
  const provided = req.header('x-api-key') || req.query.apiKey;
  if (!required) return next();
  if (provided && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(configured))) {
    return next();
  }
  return res.status(401).json({ error: 'Invalid or missing API key' });
}

module.exports = { notFound, errorHandler, asyncHandler, requestLogger, requireApiKey, DEV_KEY };
