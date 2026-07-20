import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { getDeviceId, ensureRegistered, getDeviceToken, getDecoyToken, getDecoyId } from './device';
import { Threat, ScanResult, NetworkConnection, Alert, Settings, DeviceAnonymization, MetadataStripResult, FingerprintStatus, TrackerBlock } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// A separate client for DECOY (duress) traffic. It carries the decoy device's
// own JWT so decoy vault items / duress incidents are stored under the decoy
// identity and can never be linked to the real account.
const decoyClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Attach the verified device JWT (and the authenticated deviceId) to every
// request. The backend trusts the JWT's subject, not a client-supplied id.
async function attachAuth(config: any, tokenGetter: () => Promise<string | null>, idGetter: () => Promise<string | null>) {
  const token = await tokenGetter();
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  const deviceId = await idGetter();
  if (deviceId) {
    if (config.method?.toLowerCase() === 'get') {
      config.params = { ...(config.params || {}), deviceId };
    } else {
      // Interceptor's authenticated deviceId wins over any body-supplied one.
      config.data = { ...(config.data || {}), deviceId };
    }
  }
  return config;
}

api.interceptors.request.use((config) => attachAuth(config, getDeviceToken, getDeviceIdAsyncOrSync));
decoyClient.interceptors.request.use((config) => attachAuth(config, getDecoyToken, getDecoyId));

// Resolves to the real deviceId (async, awaits registration so the first call
// still carries the correct identity).
async function getDeviceIdAsyncOrSync(): Promise<string | null> {
  await ensureRegistered().catch(() => undefined);
  return getDeviceId();
}

// ─── Threat API ──────────────────────────────────────────────────────
export const threatApi = {
  getAllThreats: async (): Promise<Threat[]> => {
    const response = await api.get('/threats');
    return response.data;
  },

  checkApp: async (packageName: string): Promise<Threat | null> => {
    try {
      const response = await api.get(`/threats/check/${packageName}`);
      return response.data;
    } catch {
      return null;
    }
  },

  getThreatFeed: async (): Promise<Threat[]> => {
    const response = await api.get('/threats/feed');
    return response.data;
  },
};

// ─── Scan API ────────────────────────────────────────────────────────
export const scanApi = {
  submitScan: async (apps: any[]): Promise<ScanResult> => {
    const response = await api.post('/scan', { apps });
    return response.data;
  },

  getScanHistory: async (): Promise<ScanResult[]> => {
    const response = await api.get('/scan/history');
    return response.data;
  },
};

// ─── Network API ─────────────────────────────────────────────────────
export const networkApi = {
  checkDomain: async (domain: string): Promise<{ risk: string; type: string }> => {
    const response = await api.get(`/network/check/${domain}`);
    return response.data;
  },

  checkIp: async (ip: string): Promise<{ risk: string; type: string }> => {
    const response = await api.get(`/network/check-ip/${ip}`);
    return response.data;
  },

  getConnections: async (): Promise<NetworkConnection[]> => {
    const response = await api.get('/network/connections');
    return response.data;
  },
};

// ─── Alert API ───────────────────────────────────────────────────────
export const alertApi = {
  getAlerts: async (): Promise<Alert[]> => {
    const response = await api.get('/alerts');
    return response.data;
  },

  markAsRead: async (alertId: string): Promise<void> => {
    await api.patch(`/alerts/${alertId}/read`);
  },

  dismissAlert: async (alertId: string): Promise<void> => {
    await api.delete(`/alerts/${alertId}`);
  },
};

// ─── Stats API ──────────────────────────────────────────────────────
export const statsApi = {
  getStats: async (): Promise<{
    totalThreats: number;
    knownHashes: number;
    suspiciousDomains: number;
    [key: string]: any;
  }> => {
    const response = await api.get('/stats');
    return response.data;
  },
};

// ─── Settings API ────────────────────────────────────────────────────
export const settingsApi = {
  getSettings: async (): Promise<Settings> => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<Settings>): Promise<Settings> => {
    const response = await api.patch('/settings', settings);
    return response.data;
  },
};

// ─── AI Analysis API ─────────────────────────────────────────────────
export interface AiAnalysisResult {
  packageName: string;
  score: number;
  confidence: number;
  riskFactors: string[];
  recommendation: string;
  analyzedAt: number;
}

export interface AiHashAnalysisResult {
  match: boolean;
  matchedHashes: string[];
  threatNames: string[];
  analyzedAt: number;
}

export interface AiPattern {
  pattern: string;
  weight: number;
  description: string;
}

export interface AiPatternsResult {
  patterns: AiPattern[];
  signatures: string[];
}

export const aiApi = {
  analyzeThreat: async (
    packageName: string,
    permissions: string[] = [],
    indicators: string[] = []
  ): Promise<AiAnalysisResult> => {
    const response = await api.post('/ai/analyze', { packageName, permissions, indicators });
    return response.data;
  },

  analyzeHashes: async (content: string): Promise<AiHashAnalysisResult> => {
    const response = await api.post('/ai/analyze-hashes', { content });
    return response.data;
  },

  getPatterns: async (): Promise<AiPatternsResult> => {
    const response = await api.get('/ai/patterns');
    return response.data;
  },

  advise: async (signals: any): Promise<AiAdvice> => {
    const response = await api.post('/ai/advise', { signals });
    return response.data;
  },

  summarizeIncident: async (events: any[]): Promise<AiIncidentReport> => {
    const response = await api.post('/ai/summarize-incident', { events });
    return response.data;
  },

  privacyCoach: async (signals: any): Promise<AiPrivacyCoach> => {
    const response = await api.post('/ai/privacy-coach', { signals });
    return response.data;
  },

  threatExplain: async (warning: string): Promise<AiThreatExplain> => {
    const response = await api.post('/ai/threat-explain', { warning });
    return response.data;
  },

  emergencyAssist: async (context: any): Promise<AiEmergencyAssist> => {
    const response = await api.post('/ai/emergency-assist', { context });
    return response.data;
  },
};

// ─── Anonymization API ───────────────────────────────────────────────
export interface AnonymizeDeviceResult {
  originalDeviceId: string;
  maskedDeviceId: string;
  advertisingId: string;
  macAddress: string;
  status: string;
  lastRotated: number;
}

export interface AnonymizeRotateResult {
  success: boolean;
  newDeviceId: string;
  newMac: string;
  timestamp: number;
}

export interface AnonymizeFingerprintResult {
  canvasHash: string;
  audioHash: string;
  fontHash: string;
  randomized: boolean;
}

export const anonymizeApi = {
  getDevice: async (): Promise<AnonymizeDeviceResult> => {
    const response = await api.get('/anonymize/device');
    return response.data;
  },

  rotateIdentifiers: async (): Promise<AnonymizeRotateResult> => {
    const response = await api.post('/anonymize/rotate');
    return response.data;
  },

  stripMetadata: async (
    fileName: string,
    metadata: Record<string, any>
  ): Promise<MetadataStripResult> => {
    const response = await api.post('/anonymize/metadata/strip', { fileName, metadata });
    return response.data;
  },

  getFingerprint: async (): Promise<AnonymizeFingerprintResult> => {
    const response = await api.get('/anonymize/fingerprint');
    return response.data;
  },

  randomizeFingerprint: async (): Promise<{ canvasHash: string; audioHash: string; fontHash: string; timestamp: number }> => {
    const response = await api.post('/anonymize/fingerprint/randomize');
    return response.data;
  },

  getTrackers: async (): Promise<TrackerBlock[]> => {
    const response = await api.get('/anonymize/trackers');
    return response.data;
  },
};

// ─── Subscription / Entitlements API ────────────────────────────────
// These types are the shared contract, imported from the single source of truth.
export type { FeatureDef, Entitlements, PlanDef, Tier } from '@shieldguard/shared';

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

// ─── Family plan types ────────────────────────────────────────────────
export type FamilyRole = 'owner' | 'member';
export type FamilyMemberStatus = 'pending' | 'active';

export interface FamilyMember {
  name?: string;
  email?: string;
  phone?: string;
  status: FamilyMemberStatus;
  isYou: boolean;
  isOwner: false;
}

export interface FamilyView {
  id: string;
  name: string;
  role: FamilyRole;
  deviceLimit: number;
  deviceCount: number;
  inviteCode?: string;
  members: FamilyMember[];
}

export interface InvitePayload {
  name?: string;
  email?: string;
  phone?: string;
}

export const subscriptionApi = {
  getFeatures: async (): Promise<FeatureDef[]> => {
    const response = await api.get('/features');
    return response.data;
  },

  getEntitlements: async (): Promise<Entitlements> => {
    const response = await api.get('/me');
    return response.data;
  },

  getPlans: async (): Promise<PlanDef[]> => {
    const response = await api.get('/billing/plans');
    return response.data;
  },

  // Creates a Stripe Checkout session and returns the hosted URL to open.
  checkout: async (plan: 'standard' | 'premium'): Promise<CheckoutResult> => {
    const response = await api.post('/billing/checkout', { plan });
    return response.data;
  },

  // Fallback activation confirmation (the webhook normally activates the sub).
  confirm: async (sessionId: string): Promise<Entitlements> => {
    const response = await api.post('/billing/confirm', { sessionId });
    return response.data;
  },
};

// ─── Family API ───────────────────────────────────────────────────────
export const familyApi = {
  // Creates a family group for the given device. Idempotent: returns the
  // existing group if the device is already an owner or active member.
  create: async (deviceId: string, name?: string): Promise<FamilyView> => {
    const response = await api.post('/family/create', { deviceId, name });
    return response.data;
  },

  // Returns the device's family view, or null when not in a family.
  get: async (deviceId: string): Promise<FamilyView | null> => {
    const response = await api.get('/family', { params: { deviceId } });
    return response.data;
  },

  // Owner-only: invites a member by email and/or phone (+ optional name).
  invite: async (ownerDeviceId: string, payload: InvitePayload): Promise<FamilyView> => {
    const response = await api.post('/family/invite', { deviceId: ownerDeviceId, ...payload });
    return response.data;
  },

  // Joins a family using an invite code (+ optional display name).
  join: async (deviceId: string, inviteCode: string, name?: string): Promise<FamilyView> => {
    const response = await api.post('/family/join', { deviceId, inviteCode, name });
    return response.data;
  },

  // Owner-only: removes a member from the family.
  removeMember: async (ownerDeviceId: string, memberDeviceId: string): Promise<FamilyView> => {
    const response = await api.delete(`/family/member/${memberDeviceId}`, {
      params: { deviceId: ownerDeviceId },
    });
    return response.data;
  },

  // Member-only: leaves the family the device belongs to.
  leave: async (deviceId: string): Promise<{ success: true }> => {
    const response = await api.post('/family/leave', { deviceId });
    return response.data;
  },
};

// ─── Vault API (zero-knowledge: payloads already encrypted client-side) ──────
export interface VaultItemMeta {
  id: string;
  folder: string;
  name: string;
  mimeType: string;
  kind: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface VaultItem extends VaultItemMeta {
  payload: string; // encrypted JSON blob
}

export type VaultKind = 'photo' | 'video' | 'doc' | 'audio' | 'note' | 'password' | 'id';

export const vaultApi = {
  list: (): Promise<VaultItemMeta[]> =>
    api.get('/vault/items').then((r) => (r.data.items as VaultItemMeta[]) || []),
  get: (id: string): Promise<VaultItem> => api.get(`/vault/items/${id}`).then((r) => r.data),
  create: (item: { folder: string; name: string; mimeType: string; kind: string; payload: string; favorite?: boolean }): Promise<VaultItem> =>
    api.post('/vault/items', item).then((r) => r.data),
  update: (id: string, patch: Partial<{ folder: string; name: string; mimeType: string; kind: string; payload: string; favorite: boolean }>): Promise<VaultItem> =>
    api.put(`/vault/items/${id}`, patch).then((r) => r.data),
  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/vault/items/${id}`).then((r) => r.data),
};

// ─── Decoy vault (same shape, SEPARATE decoy identity) ───────────────────────
// All decoy traffic rides the decoyClient so it is stored under the unlinkable
// decoy device identity, never the real one.
export const decoyApi = {
  list: (): Promise<VaultItemMeta[]> =>
    decoyClient.get('/vault/decoy/items').then((r) => (r.data.items as VaultItemMeta[]) || []),
  get: (id: string): Promise<VaultItem> => decoyClient.get(`/vault/decoy/items/${id}`).then((r) => r.data),
  create: (item: { folder: string; name: string; mimeType: string; kind: string; payload: string; favorite?: boolean }): Promise<VaultItem> =>
    decoyClient.post('/vault/decoy/items', item).then((r) => r.data),
  update: (id: string, patch: Partial<{ folder: string; name: string; mimeType: string; kind: string; payload: string; favorite: boolean }>): Promise<VaultItem> =>
    decoyClient.put(`/vault/decoy/items/${id}`, patch).then((r) => r.data),
  remove: (id: string): Promise<{ success: boolean }> =>
    decoyClient.delete(`/vault/decoy/items/${id}`).then((r) => r.data),
};

// ─── Password manager API ────────────────────────────────────────────────────
export interface PasswordItem {
  id: string;
  name: string;
  username?: string;
  siteUrl?: string;
  payload: string; // encrypted JSON { password, notes }
  strength?: number;
  createdAt: number;
}

export const passwordApi = {
  list: (): Promise<PasswordItem[]> =>
    api.get('/passwords/items').then((r) => (r.data.items as PasswordItem[]) || []),
  get: (id: string): Promise<PasswordItem> => api.get(`/passwords/items/${id}`).then((r) => r.data),
  create: (e: { name: string; username?: string; siteUrl?: string; payload: string; strength?: number }): Promise<PasswordItem> =>
    api.post('/passwords/items', e).then((r) => r.data),
  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/passwords/items/${id}`).then((r) => r.data),
};

// ─── Backup / Restore API (zero-knowledge: ciphertext only) ──────────────────
export interface BackupRecord {
  id: string;
  name?: string;
  ciphertext: string; // encrypted export blob, server-encrypted-free
  createdAt: number;
}

export const backupApi = {
  export: (ciphertext: string, name?: string): Promise<{ id: string; createdAt: number }> =>
    api.post('/backup/export', { ciphertext, name }).then((r) => r.data),
  getLatest: (): Promise<BackupRecord | { error: string }> =>
    api.get('/backup/latest').then((r) => r.data),
};

// ─── Device security posture / scan API ───────────────────────────────────────
export const deviceSecurityApi = {
  postScan: (posture: any, details?: any): Promise<{ id?: string; saved: boolean }> =>
    api.post('/device/security-scan', { posture, details }).then((r) => r.data),
  getScan: (): Promise<any> =>
    api.get('/device/security-scan').then((r) => r.data),
};

// ─── Encrypted sync relay (zero-knowledge: ciphertext only) ─────────────────
export interface SyncItem {
  id: string;
  deviceId: string;
  channel: string;
  ciphertext: string;
  kind?: string;
  updatedAt: number;
}

export const syncApi = {
  push: (channel: string, ciphertext: string, kind?: string): Promise<{ id: string; updatedAt: number }> =>
    api.post('/sync/push', { channel, ciphertext, kind }).then((r) => r.data),
  pull: (channel: string, since?: number): Promise<{ items: SyncItem[] }> =>
    api.get('/sync/pull', { params: { channel, since } }).then((r) => r.data),
};

// ─── Remote device commands (owner → member) ────────────────────────────────
export type DeviceCommandType = 'wipe' | 'lock' | 'notify';
export type DeviceCommandStatus = 'pending' | 'acked';

export interface DeviceCommand {
  id: string;
  targetDeviceId: string;
  type: DeviceCommandType;
  payload?: any;
  status: DeviceCommandStatus;
  createdAt: number;
}

export const commandApi = {
  issue: (targetDeviceId: string, type: DeviceCommandType, payload?: any): Promise<{ id: string }> =>
    api.post('/device/command', { targetDeviceId, type, payload }).then((r) => r.data),
  pending: (): Promise<{ commands: DeviceCommand[] }> =>
    api.get('/device/commands').then((r) => r.data),
  ack: (id: string): Promise<{ success: boolean }> =>
    api.post(`/device/command/${id}/ack`).then((r) => r.data),
};

// ─── Audit log (server mirror) ───────────────────────────────────────────────
export interface AuditEvent {
  id: string;
  type: string;
  at: number;
}

export const auditApi = {
  append: (type: string): Promise<{ id: string; at: number }> =>
    api.post('/audit', { type }).then((r) => r.data),
  list: (): Promise<{ events: AuditEvent[] }> =>
    api.get('/audit').then((r) => r.data),
};

// ─── AI advisor / incident report API ─────────────────────────────────────────
export interface AiAdvice {
  provider: 'rule-based' | 'llm';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  recommendations: string[];
}

export interface AiPrivacyCoach {
  provider: 'rule-based' | 'llm';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  tips: string[];
}

export interface AiThreatExplain {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  recommendedActions: string[];
}

export interface AiEmergencyAssist {
  steps: string[];
  contactsNote: string;
}

export interface AiIncidentReport {
  report: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  generatedAt: number;
  provider: 'rule-based' | 'llm';
}

// ─── Secure share API ────────────────────────────────────────────────────────
export interface ShareMeta {
  token: string;
  name?: string;
  mimeType?: string;
  maxViews?: number;
  ttlSeconds?: number;
  views?: number;
  expiresAt?: number;
}

export const shareApi = {
  create: (s: { payload: string; iv?: string; name?: string; mimeType?: string; maxViews?: number; ttlSeconds?: number }): Promise<ShareMeta> =>
    api.post('/share', s).then((r) => r.data),
  fetch: (token: string): Promise<{ payload: string; name?: string; mimeType?: string; views?: number }> =>
    api.get(`/share/${token}`).then((r) => r.data),
};

// ─── Incident API (panic / duress / sos) ─────────────────────────────────────
export type IncidentType = 'panic' | 'duress' | 'sos';

export interface Incident {
  id: string;
  type: IncidentType;
  createdAt: number;
  location?: { lat: number; lng: number };
  battery?: number;
  note?: string;
  metadata?: Record<string, any>;
}

export const incidentsApi = {
  create: (i: { type: IncidentType; location?: any; battery?: number; note?: string; metadata?: any }): Promise<Incident> =>
    api.post('/incidents', i).then((r) => r.data),
  // Duress alerts are filed under the DECOY identity so they cannot be linked
  // to the real vault/account (closes the duress-leak gap).
  createDecoy: (i: { type: IncidentType; location?: any; battery?: number; note?: string; metadata?: any }): Promise<Incident> =>
    decoyClient.post('/incidents', i).then((r) => r.data),
  list: (): Promise<Incident[]> => api.get('/incidents').then((r) => r.data),
};

// ─── Threat dashboard / device posture API ───────────────────────────────────
export interface DevicePosture {
  rooted: boolean;
  developerMode: boolean;
  vpnActive: boolean;
  screenLock: boolean;
  biometrics: boolean;
  osUpdates: boolean;
  appIntegrity: boolean;
}

export interface DashboardResult {
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export const dashboardApi = {
  check: (posture: DevicePosture): Promise<DashboardResult> =>
    api.post('/threat-dashboard', { posture }).then((r) => r.data),
};

// ─── Emergency SOS API ───────────────────────────────────────────────────────
export const sosApi = {
  trigger: (p: { location?: any; message?: string; contacts?: any[]; battery?: number }): Promise<{ id: string }> =>
    api.post('/emergency/sos', p).then((r) => r.data),
};

export { api };
export default api;