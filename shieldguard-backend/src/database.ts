import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StoredScan {
  id: string;
  timestamp: number;
  appsScanned: number;
  threatsFound: number;
  apps: any[];
}

interface StoredAlert {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  severity: string;
  type: string;
  read: boolean;
}

interface StoredSettings {
  autoScanEnabled: boolean;
  scanInterval: number;
  realTimeMonitoring: boolean;
  notificationsEnabled: boolean;
  threatAlertsEnabled: boolean;
  networkMonitoringEnabled: boolean;
  backgroundScanning: boolean;
}

interface Database {
  scans: StoredScan[];
  alerts: StoredAlert[];
  settings: StoredSettings;
}

const DB_PATH = path.join(__dirname, '..', 'data', 'shieldguard-db.json');

function ensureDbDir(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function load(): Database {
  ensureDbDir();
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    console.warn('DB corrupted, resetting');
  }
  return {
    scans: [],
    alerts: [
      {
        id: 'init-1',
        timestamp: Date.now() - 3600000,
        title: 'New Threat Detected',
        message: 'A new spyware variant has been identified in our threat database',
        severity: 'high',
        type: 'threat',
        read: false,
      },
    ],
    settings: {
      autoScanEnabled: false,
      scanInterval: 86400000,
      realTimeMonitoring: true,
      notificationsEnabled: true,
      threatAlertsEnabled: true,
      networkMonitoringEnabled: true,
      backgroundScanning: false,
    },
  };
}

function save(db: Database): void {
  ensureDbDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function getScans(): StoredScan[] {
  return load().scans;
}

export function addScan(scan: StoredScan): void {
  const db = load();
  db.scans.push(scan);
  save(db);
}

export function getAlerts(): StoredAlert[] {
  return load().alerts;
}

export function addAlert(alert: StoredAlert): void {
  const db = load();
  db.alerts.unshift(alert);
  save(db);
}

export function markAlertRead(alertId: string): StoredAlert | null {
  const db = load();
  const alert = db.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.read = true;
    save(db);
    return alert;
  }
  return null;
}

export function deleteAlert(alertId: string): boolean {
  const db = load();
  const idx = db.alerts.findIndex(a => a.id === alertId);
  if (idx !== -1) {
    db.alerts.splice(idx, 1);
    save(db);
    return true;
  }
  return false;
}

export function getSettings(): StoredSettings {
  return load().settings;
}

export function updateSettings(updates: Partial<StoredSettings>): StoredSettings {
  const db = load();
  Object.assign(db.settings, updates);
  save(db);
  return db.settings;
}

export function getStats() {
  const db = load();
  return {
    totalScans: db.scans.length,
    totalAlerts: db.alerts.length,
    unreadAlerts: db.alerts.filter(a => !a.read).length,
    lastScan: db.scans.length > 0 ? db.scans[db.scans.length - 1].timestamp : null,
  };
}
