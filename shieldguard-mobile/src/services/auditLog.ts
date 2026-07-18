import AsyncStorage from '@react-native-async-storage/async-storage';

const AUDIT_LOG_KEY = 'shieldguard_audit_log';
const AUDIT_LOG_CAP = 200;

export interface AuditLogEntry {
  id: string;
  type: string;
  at: number;
}

// Attempt to mirror an event to the server (best-effort, never throws).
export async function syncEvent(type: string): Promise<void> {
  try {
    const { auditApi } = await import('./api');
    await auditApi.append(type);
  } catch {
    // ignore network failure — local log is the source of truth
  }
}

// Append a local audit event and (best-effort) mirror it to the server.
export async function add(type: string): Promise<void> {
  try {
    const entry: AuditLogEntry = {
      id: `al_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      type,
      at: Date.now(),
    };
    const raw = await AsyncStorage.getItem(AUDIT_LOG_KEY);
    const list: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    const capped = list.slice(0, AUDIT_LOG_CAP);
    await AsyncStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(capped));
  } catch {
    // ignore storage failure
  }
  // Fire-and-forget server mirror.
  syncEvent(type).catch(() => undefined);
}

// Return the local audit log (newest first).
export async function list(): Promise<AuditLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditLogEntry[]) : [];
  } catch {
    return [];
  }
}
