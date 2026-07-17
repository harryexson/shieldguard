export interface Threat {
  id: string;
  name: string;
  type: 'spyware' | 'malware' | 'adware' | 'ransomware' | 'trojan' | 'surveillance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  packageNames: string[];
  indicators: string[];
  remediation: string;
}

export interface AppInfo {
  name: string;
  packageName: string;
  version: string;
  installedAt: number;
  permissions: string[];
  isFromStore: boolean;
  threatLevel: 'safe' | 'warning' | 'danger' | 'critical';
  threat?: Threat;
}

export interface NetworkConnection {
  id: string;
  appName: string;
  domain: string;
  ip: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'HTTP' | 'HTTPS';
  bytesIn: number;
  bytesOut: number;
  timestamp: number;
  reputation: 'safe' | 'suspicious' | 'dangerous' | 'unknown';
}

export interface PermissionInfo {
  name: string;
  description: string;
  isDangerous: boolean;
  apps: string[];
}

export interface ScanResult {
  id: string;
  timestamp: number;
  appsScanned: number;
  threatsFound: number;
  apps: AppInfo[];
}

export interface SecurityAudit {
  timestamp: number;
  score: number;
  checks: SecurityCheck[];
}

export interface SecurityCheck {
  name: string;
  passed: boolean;
  details: string;
  recommendation?: string;
}

export interface DeviceInfo {
  manufacturer: string;
  model: string;
  osVersion: string;
  securityPatch: string;
  isRooted: boolean;
  isEncrypted: boolean;
  hasGooglePlayServices: boolean;
}

export interface Alert {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'threat' | 'warning' | 'info';
  read: boolean;
}

export interface Settings {
  autoScanEnabled: boolean;
  scanInterval: number;
  realTimeMonitoring: boolean;
  notificationsEnabled: boolean;
  threatAlertsEnabled: boolean;
  networkMonitoringEnabled: boolean;
  backgroundScanning: boolean;
  deviceAnonymization: boolean;
  macSpoofing: boolean;
  gpsSpoofing: boolean;
  deviceIdRandomization: boolean;
  metadataStripping: boolean;
  screenshotBlocking: boolean;
  fingerprintProtection: boolean;
  deepLinkProtection: boolean;
  trackerBlocking: boolean;
  vpnDetection: boolean;
  fingerprintRandomization: boolean;
  dohEnabled: boolean;
}

export interface DeviceAnonymization {
  enabled: boolean;
  originalDeviceId: string;
  maskedDeviceId: string;
  originalMac: string;
  maskedMac: string;
  rotationInterval: number;
  lastRotated: number;
}

export interface MetadataStripResult {
  success: boolean;
  fileName: string;
  removedFields: string[];
}

export interface FingerprintStatus {
  browserHash: string;
  canvasHash: string;
  audioHash: string;
  fontHash: string;
  randomized: boolean;
}

export interface TrackerBlock {
  id: string;
  domain: string;
  category: string;
  blocked: boolean;
}

export interface ContentProtection {
  screenshotBlocked: boolean;
  screenRecordingBlocked: boolean;
  contentCaptureBlocked: boolean;
}

export interface AntiTrackingStatus {
  trackersBlocked: number;
  fingerprintsRandomized: boolean;
  cookiesBlocked: number;
  referrerSanitized: boolean;
}

export interface AppStats {
  totalApps: number;
  safeApps: number;
  warningApps: number;
  dangerousApps: number;
  lastScan: number | null;
}