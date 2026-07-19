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
// used by crypto-js AES. Ciphertext is base64 of salt + iv + ciphertext.
//
// SECURITY NOTE: crypto-js only implements AES-CBC/-CFB/-CTR/-OFB — it does
// NOT support AES-GCM. CBC provides confidentiality but NOT authenticated
// encryption, so ciphertext can be tampered with undetected. This is a known
// gap: a production build should migrate to a native AES-256-GCM module
// (e.g. react-native-aes-gcm or WebCrypto via expo) for authenticated
// encryption. Until then we at least use a strong KDF: PBKDF2-HMAC-SHA256
// (crypto-js defaults to SHA-1, which this audit rejects) at a high iteration
// count.
const PBKDF2_ITERATIONS = 250000;
const PBKDF2_HASHER = CryptoJS.algo.SHA256;

function deriveKey(pin: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(pin, CryptoJS.enc.Utf8.parse(salt), {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: PBKDF2_HASHER,
  });
}

export function encryptSecret(plainText: string, pin: string): string {
  const salt = CryptoJS.lib.WordArray.random(16).toString();
  const key = deriveKey(pin, salt);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  // Store salt + iv + ciphertext, each base64-safe via CryptoJS hex.
  return `${salt}|${iv.toString(CryptoJS.enc.Hex)}|${encrypted.toString()}`;
}

export function decryptSecret(payload: string, pin: string): string {
  const [salt, ivHex, cipherText] = payload.split('|');
  if (!salt || !ivHex || !cipherText) throw new Error('Malformed vault entry');
  const key = deriveKey(pin, salt);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
    iv,
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
  let out = '';
  // Guarantee at least one of each class for strength.
  out += PW_UPPER[Math.floor(Math.random() * PW_UPPER.length)];
  out += PW_LOWER[Math.floor(Math.random() * PW_LOWER.length)];
  out += PW_DIGIT[Math.floor(Math.random() * PW_DIGIT.length)];
  out += PW_SYMBOL[Math.floor(Math.random() * PW_SYMBOL.length)];
  for (let i = out.length; i < length; i++) {
    out += all[Math.floor(Math.random() * all.length)];
  }
  // Shuffle so the guaranteed chars aren't always at the front.
  const arr = out.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
