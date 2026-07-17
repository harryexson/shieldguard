import crypto from 'crypto';
import type { User } from './rbac';

/**
 * Signed, httpOnly session cookie helpers.
 *
 * The cookie value is `payload.signature` where:
 *   payload   = base64url(JSON{ sub, iat, exp })
 *   signature = HMAC-SHA256(payload, AUTH_SECRET)
 *
 * Uses only Node's built-in `crypto` — no extra dependencies.
 * AUTH_SECRET can be set in the environment; a dev fallback is used only
 * when the secret is missing (NEVER rely on the fallback in production).
 */

export const SESSION_COOKIE = 'sg_session';
const DEFAULT_SECRET = 'dev-only-insecure-secret-change-me';

function getSecret(): string {
  return process.env.AUTH_SECRET && process.env.AUTH_SECRET.length > 0
    ? process.env.AUTH_SECRET
    : DEFAULT_SECRET;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payload: string): string {
  return b64url(crypto.createHmac('sha256', getSecret()).update(payload).digest());
}

export interface SessionData {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

const SEVEN_DAYS = 7 * 24 * 60 * 60;

export function createSessionToken(user: User): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload: SessionData = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat,
    exp: iat + SEVEN_DAYS,
  };
  const encoded = b64url(Buffer.from(JSON.stringify(payload)));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionData | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  const expected = sign(encoded);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const json = fromB64url(encoded).toString('utf8');
    const data = JSON.parse(json) as SessionData;
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SEVEN_DAYS;
