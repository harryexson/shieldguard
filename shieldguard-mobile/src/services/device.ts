import { Settings } from 'react-native';

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
// entitlements on the backend. Persisted in React Native Settings so it
// survives app restarts.
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    const stored = Settings.get(DEVICE_ID_KEY) as string | undefined;
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch {
    // Settings unavailable (e.g. some test environments) — fall through.
  }
  const generated = `sg_${generateUuid()}`;
  cachedDeviceId = generated;
  try {
    Settings.set({ [DEVICE_ID_KEY]: generated });
  } catch {
    // Non-fatal: entitlements will be per-session until persisted.
  }
  return generated;
}

export function setDeviceId(id: string): void {
  cachedDeviceId = id;
  try {
    Settings.set({ [DEVICE_ID_KEY]: id });
  } catch {
    // ignore
  }
}
