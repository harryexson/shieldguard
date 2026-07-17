import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { getDeviceId } from './device';
import { Threat, ScanResult, NetworkConnection, Alert, Settings, DeviceAnonymization, MetadataStripResult, FingerprintStatus, TrackerBlock } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Attach the per-install deviceId to every request so the backend can evaluate
// subscription entitlements (it returns 402 when a feature is not included).
api.interceptors.request.use((config) => {
  const deviceId = getDeviceId();
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), deviceId };
  } else {
    config.data = { deviceId, ...(config.data || {}) };
  }
  return config;
});

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
export interface FeatureDef {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'standard' | 'premium';
  deliveredBy: 'backend' | 'mobile' | 'mobile+backend' | 'human';
}

export interface Entitlements {
  deviceId: string;
  tier: 'free' | 'standard' | 'premium';
  subscriptionId: string | null;
  status: 'active' | 'none' | 'canceled' | 'past_due';
  renewsAt: number | null;
  plan: string | null;
  features: string[];
}

export interface PlanDef {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
  highlighted?: boolean;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
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

export { api };
export default api;