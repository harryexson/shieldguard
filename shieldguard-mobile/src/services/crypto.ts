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
const PBKDF2_ITERATIONS = 10000;

function deriveKey(pin: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(pin, CryptoJS.enc.Utf8.parse(salt), {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
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
