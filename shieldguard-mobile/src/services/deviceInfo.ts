import { BatteryManager } from 'expo-device';

// Best-effort battery level. Returns a number 0-1, or null if unavailable.
// expo-device BatteryManager is optional and may be undefined on some platforms.
export async function getBatteryLevel(): Promise<number | null> {
  try {
    if (typeof BatteryManager !== 'undefined' && BatteryManager.getBatteryLevelAsync) {
      const lvl = await BatteryManager.getBatteryLevelAsync();
      return typeof lvl === 'number' ? lvl : null;
    }
  } catch {
    // ignore
  }
  return null;
}
