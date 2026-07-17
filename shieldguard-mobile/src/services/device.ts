import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'shieldguard_device_id';

let cachedDeviceId: string | null = null;

// RFC4122-ish v4 UUID without external dependencies.
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

// Returns a stable per-install device identifier used to track subscription
// entitlements on the backend. Persisted in AsyncStorage so it survives app
// restarts (replaces RN Settings, which is deprecated/iOS-only).
export async function getDeviceIdAsync(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch {
    // AsyncStorage unavailable (e.g. some test environments) — fall through.
  }
  const generated = `sg_${generateUuid()}`;
  cachedDeviceId = generated;
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  } catch {
    // Non-fatal: entitlements will be per-session until persisted.
  }
  return generated;
}

// Synchronous accessor for call sites that need a quick value synchronously
// (falls back to a fresh id that is then persisted). Prefer getDeviceIdAsync.
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  const generated = `sg_${generateUuid()}`;
  cachedDeviceId = generated;
  getDeviceIdAsync().catch(() => undefined);
  return generated;
}

export async function setDeviceId(id: string): Promise<void> {
  cachedDeviceId = id;
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignore
  }
}

// Clears all locally stored ShieldGuard data (used by the auto-wipe feature).
export async function clearLocalData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch {
    // ignore
  }
  cachedDeviceId = null;
}
