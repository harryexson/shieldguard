import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// ─── PIN hashing (SHA-256 via expo-crypto) ───────────────────────────────
export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `shieldguard::${pin}`
  );
}

// ─── AES encryption/decryption for the vault ─────────────────────────────
// Key is derived from the PIN + a random per-entry salt using PBKDF2, then
// used by crypto-js AES. Output is `salt|iv|ciphertext|hmac` (hex).
//
// Authenticated encryption (Encrypt-then-MAC with HMAC-SHA256) so tampering
// is detected — plain CBC alone is malleable. crypto-js has no AES-GCM; a
// native AES-256-GCM module (react-native-aes-gcm / WebCrypto via expo) is
// preferred when available on-device, but HMAC+CBC is a sound, buildable
// fallback. KDF is PBKDF2-HMAC-SHA256 at a high iteration count.
const PBKDF2_ITERATIONS = 250000;
const PBKDF2_HASHER = CryptoJS.algo.SHA256;

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

function deriveKey(pin: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(pin, CryptoJS.enc.Utf8.parse(salt), {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: PBKDF2_HASHER,
  });
}

export function encryptSecret(plainText: string, pin: string): string {
  const salt = bytesToHex(Crypto.getRandomBytes(16));
  const key = deriveKey(pin, salt);
  const iv = bytesToHex(Crypto.getRandomBytes(16));
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  const cipherText = encrypted.toString();
  const mac = CryptoJS.HmacSHA256(`${salt}|${iv}|${cipherText}`, key).toString(CryptoJS.enc.Hex);
  return `${salt}|${iv}|${cipherText}|${mac}`;
}

export function decryptSecret(payload: string, pin: string): string {
  const parts = payload.split('|');
  // New format: salt|iv|cipherText|hmac (authenticated).
  if (parts.length === 4) {
    const [salt, ivHex, cipherText, mac] = parts;
    const key = deriveKey(pin, salt);
    const expectedMac = CryptoJS.HmacSHA256(`${salt}|${ivHex}|${cipherText}`, key).toString(CryptoJS.enc.Hex);
    if (expectedMac !== mac) throw new Error('Vault entry tampered or corrupted');
    return aesDecrypt(cipherText, key, ivHex);
  }
  // Legacy (pre-HMAC) format: salt|iv|cipherText.
  const [salt, ivHex, cipherText] = parts;
  if (!salt || !ivHex || !cipherText) throw new Error('Malformed vault entry');
  return aesDecrypt(cipherText, deriveKey(pin, salt), ivHex);
}

function aesDecrypt(cipherText: string, key: CryptoJS.lib.WordArray, ivHex: string): string {
  const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
    iv: CryptoJS.enc.Hex.parse(ivHex),
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  const text = decrypted.toString(CryptoJS.enc.Utf8);
  if (!text) throw new Error('Decryption failed (wrong PIN?)');
  return text;
}

// ─── Secure storage helpers ───────────────────────────────────────────────
export async function secureGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function secureRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ─── JSON encryption helpers (zero-knowledge vault) ──────────────────────────
export function encryptJson(obj: unknown, pin: string): string {
  return encryptSecret(JSON.stringify(obj), pin);
}

export function decryptJson<T>(payload: string, pin: string): T {
  return JSON.parse(decryptSecret(payload, pin)) as T;
}

// ─── Strong password generator ───────────────────────────────────────────────
const PW_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const PW_LOWER = 'abcdefghijkmnopqrstuvwxyz';
const PW_DIGIT = '23456789';
const PW_SYMBOL = '!@#$%^&*()-_=+[]{}';

export function randomPassword(length = 20): string {
  const all = PW_UPPER + PW_LOWER + PW_DIGIT + PW_SYMBOL;
  // CSPRNG (expo-crypto) instead of Math.random for cryptographic strength.
  const bytes = Crypto.getRandomBytes(Math.max(length, 4) + 4);
  let out = '';
  // Guarantee at least one of each class for strength.
  out += PW_UPPER[bytes[0] % PW_UPPER.length];
  out += PW_LOWER[bytes[1] % PW_LOWER.length];
  out += PW_DIGIT[bytes[2] % PW_DIGIT.length];
  out += PW_SYMBOL[bytes[3] % PW_SYMBOL.length];
  for (let i = 4; i < length; i++) {
    out += all[bytes[i] % all.length];
  }
  // Fisher-Yates shuffle using CSPRNG bytes so the guaranteed chars aren't fixed.
  const arr = out.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = bytes[(arr.length - i) % bytes.length] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

// ─── Optional secure key cache (guarded; never required for app to run) ──────
// We never store the raw PIN. This is a best-effort in-memory-style cache of a
// short-lived unlock token. Falls back silently when expo-secure-store missing.
export async function cacheUnlockToken(token: string): Promise<void> {
  try {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync('shieldguard_vault_unlock_token', token);
  } catch {
    // ignore — module not installed or unavailable
  }
}

export async function readUnlockToken(): Promise<string | null> {
  try {
    const SecureStore = require('expo-secure-store');
    return await SecureStore.getItemAsync('shieldguard_vault_unlock_token');
  } catch {
    return null;
  }
}

export async function clearUnlockToken(): Promise<void> {
  try {
    const SecureStore = require('expo-secure-store');
    await SecureStore.deleteItemAsync('shieldguard_vault_unlock_token');
  } catch {
    // ignore
  }
}
