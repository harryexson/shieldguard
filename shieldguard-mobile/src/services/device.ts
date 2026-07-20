import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

// ─── Device-bound identity ────────────────────────────────────────────
// Each install proves possession of a per-install secret stored in the OS
// secure store (expo-secure-store). On first launch it registers that secret
// with the backend and receives a signed JWT. Every backend call then carries
// that JWT; the server trusts the identity from the verified token, never a
// client-supplied deviceId. See backend src/auth.js.
//
// A SECOND, independently-registered identity (the "decoy") is created only
// when the user configures a duress PIN. It is never derived from the real
// deviceId, so the server cannot link the decoy vault/incidents to the real
// account. Under duress the app transparently uses the decoy identity.

const REAL_SECRET = 'sg_device_secret';
const REAL_ID = 'sg_device_id';
const REAL_TOKEN = 'sg_device_token';
const DECOY_SECRET = 'sg_decoy_secret';
const DECOY_ID = 'sg_decoy_id';
const DECOY_TOKEN = 'sg_decoy_token';

async function secureGet(key: string): Promise<string | null> {
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}
async function secureSet(key: string, value: string): Promise<void> {
  try { await SecureStore.setItemAsync(key, value); } catch { /* ignore */ }
}
async function secureRemove(key: string): Promise<void> {
  try { await SecureStore.deleteItemAsync(key); } catch { /* ignore */ }
}

// CSPRNG-backed per-install secret (>=16 chars, required by the backend).
function newSecret(): string {
  const bytes = Crypto.getRandomBytes(32);
  return base64FromBytes(bytes);
}

// Manual base64 (no Buffer global in React Native/Hermes).
function base64FromBytes(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += chars[b0 >> 2];
    out += chars[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? chars[b2 & 63] : '=';
  }
  return out;
}

// Register via a PLAIN axios call (no interceptor) to avoid recursion: the api
// instance's request interceptor itself calls ensureRegistered().
async function registerWithBackend(secret: string, providedId?: string): Promise<{ deviceId: string; token: string }> {
  const res = await axios.post(`${API_BASE_URL}/device/register`, { deviceSecret: secret, deviceId: providedId });
  return res.data;
}

let realTokenCache: string | null = null;
let realIdCache: string | null = null;
let decoyTokenCache: string | null = null;
let placeholderId: string | null = null;

function generateUuid(): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[(Math.floor(Math.random() * 16) & 0x3) | 0x8];
    else out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}

// Ensures this install has a registered device identity; returns the JWT.
// Safe to call repeatedly — only the first call hits the network.
export async function ensureRegistered(): Promise<string> {
  if (realTokenCache) return realTokenCache;
  const cached = await secureGet(REAL_TOKEN);
  if (cached) { realTokenCache = cached; realIdCache = await secureGet(REAL_ID); return cached; }
  let secret = await secureGet(REAL_SECRET);
  if (!secret) { secret = newSecret(); await secureSet(REAL_SECRET, secret); }
  const providedId = await secureGet(REAL_ID) || undefined;
  const { deviceId, token } = await registerWithBackend(secret, providedId);
  await secureSet(REAL_ID, deviceId);
  await secureSet(REAL_TOKEN, token);
  realTokenCache = token;
  realIdCache = deviceId;
  return token;
}

// Synchronous accessor (backwards-compatible). Returns the real deviceId once
// registered; before that, a stable per-session placeholder while registration
// is kicked off. Prefer the async getDeviceIdAsync for new code.
export function getDeviceId(): string {
  if (realIdCache) return realIdCache;
  if (!placeholderId) {
    placeholderId = `sg_${generateUuid()}`;
    ensureRegistered().catch(() => undefined);
  }
  return placeholderId;
}

export async function getDeviceIdAsync(): Promise<string | null> {
  if (realIdCache) return realIdCache;
  await ensureRegistered();
  return realIdCache;
}

export async function getDeviceToken(): Promise<string | null> {
  return realTokenCache ?? (await secureGet(REAL_TOKEN));
}

// ─── Decoy (duress) identity ──────────────────────────────────────────
export async function ensureDecoyRegistered(): Promise<string> {
  if (decoyTokenCache) return decoyTokenCache;
  const cached = await secureGet(DECOY_TOKEN);
  if (cached) { decoyTokenCache = cached; return cached; }
  const secret = newSecret();
  await secureSet(DECOY_SECRET, secret);
  // No providedId -> backend mints a fresh, unlinkable UUID.
  const { deviceId, token } = await registerWithBackend(secret);
  await secureSet(DECOY_ID, deviceId);
  await secureSet(DECOY_TOKEN, token);
  decoyTokenCache = token;
  return token;
}

export async function getDecoyId(): Promise<string | null> {
  return secureGet(DECOY_ID);
}

export async function getDecoyToken(): Promise<string | null> {
  return decoyTokenCache ?? (await secureGet(DECOY_TOKEN));
}

// Clears all locally stored ShieldGuard identity + data (used by auto-wipe).
export async function clearLocalData(): Promise<void> {
  for (const k of [REAL_SECRET, REAL_ID, REAL_TOKEN, DECOY_SECRET, DECOY_ID, DECOY_TOKEN]) {
    await secureRemove(k).catch(() => undefined);
  }
  realTokenCache = realIdCache = decoyTokenCache = placeholderId = null;
}
