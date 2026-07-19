const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

import type { FeatureDef, PlanDef, Entitlements } from '@shieldguard/shared';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      ...(options?.headers as Record<string, string> | undefined),
    };
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body?: any) { return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); }
  patch<T>(path: string, body?: any) { return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }); }
  delete<T>(path: string) { return this.request<T>(path, { method: 'DELETE' }); }
}

export const api = new ApiClient(API_BASE);

export interface Stats {
  totalThreats: number;
  knownHashes: number;
  suspiciousDomains: number;
  scansPerformed: number;
  totalAlerts: number;
  unreadAlerts: number;
}

export interface ThreatFeedItem {
  id: string;
  type: string;
  severity: string;
  deviceName?: string;
  userName?: string;
  timestamp: number;
  status: string;
}

export interface FamilyMemberDevice {
  deviceId: string;
  name?: string;
  isOwner?: boolean;
}

export interface FamilyGroup {
  id: string;
  name: string;
  ownerDeviceId: string;
  deviceCount: number;
  deviceLimit: number;
  pendingInvites: number;
  createdAt: string;
  devices?: FamilyMemberDevice[];
}

export interface FamilyAdminResponse {
  count: number;
  groups: FamilyGroup[];
}

export type AdminDeviceCommandType = 'wipe' | 'lock' | 'notify';

export interface AdminDeviceCommandResponse {
  id: string;
  targetDeviceId: string;
  type: AdminDeviceCommandType;
  createdAt?: string;
}

export interface AuditEventAdmin {
  id: string;
  type: string;
  deviceId: string;
  at: string;
}

export interface AuditAdminResponse {
  count: number;
  byType: Record<string, number>;
  recent: AuditEventAdmin[];
}

export type IncidentType = 'panic' | 'duress' | 'sos';

export interface RecentIncident {
  id: string;
  deviceId: string;
  type: IncidentType;
  status: string;
  createdAt: string;
  note?: string;
}

export interface IncidentsAdminResponse {
  count: number;
  byType: {
    panic: number;
    duress: number;
    sos: number;
  };
  recent: RecentIncident[];
}

export interface ThreatPosture {
  rooted: boolean;
  developerMode: boolean;
  vpnActive: boolean;
  screenLock: boolean;
  biometrics: boolean;
  osUpToDate: boolean;
  appIntegrity: boolean;
}

export interface ThreatDashboardResponse {
  score: number;
  riskLevel: string;
  recommendations: string[];
  checkedAt: string;
}

export interface AiReport {
  id: string;
  riskLevel: string;
  generatedAt: number;
  preview: string;
  deviceId: string;
}

export interface AiReportsAdminResponse {
  count: number;
  byRisk: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recent: AiReport[];
}

export const officeApi = {
  health: () => api.get<{ status: string }>('/health'),
  stats: () => api.get<Stats>('/stats'),
  threatsFeed: () => api.get<ThreatFeedItem[]>('/threats/feed'),
  threats: (limit = 20, offset = 0) => api.get<any[]>(`/threats?limit=${limit}&offset=${offset}`),
  features: () => api.get<FeatureDef[]>('/features'),
  alerts: () => api.get<any[]>('/alerts'),
  markAlertRead: (id: string) => api.patch(`/alerts/${id}/read`),
  me: (deviceId?: string) => api.get<Entitlements>(`/me${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`),
  billingPlans: () => api.get<PlanDef[]>('/billing/plans'),
  getFamilies: () => api.get<FamilyAdminResponse>('/family/admin'),
  getFamiliesAdmin: () => api.get<FamilyAdminResponse>('/family/admin'),
  adminDeviceCommand: (targetDeviceId: string, type: AdminDeviceCommandType, payload?: any) =>
    api.post<AdminDeviceCommandResponse>('/admin/device/command', { targetDeviceId, type, payload }),
  getIncidentsAdmin: () => api.get<IncidentsAdminResponse>('/incidents/admin'),
  scoreThreatDashboard: (posture: ThreatPosture) =>
    api.post<ThreatDashboardResponse>('/threat-dashboard', { posture }),
  getAiReportsAdmin: () => api.get<AiReportsAdminResponse>('/ai/reports/admin'),
  getAuditAdmin: () => api.get<AuditAdminResponse>('/audit/admin'),
};
