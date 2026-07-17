const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
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

export const officeApi = {
  health: () => api.get<{ status: string }>('/health'),
  stats: () => api.get<Stats>('/stats'),
  threatsFeed: () => api.get<ThreatFeedItem[]>('/threats/feed'),
  threats: (limit = 20, offset = 0) => api.get<any[]>(`/threats?limit=${limit}&offset=${offset}`),
  features: () => api.get<any[]>('/features'),
  alerts: () => api.get<any[]>('/alerts'),
  markAlertRead: (id: string) => api.patch(`/alerts/${id}/read`),
  me: (deviceId?: string) => api.get<{ tier: string; plan: string; features: string[] }>(`/me${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`),
  billingPlans: () => api.get<any[]>('/billing/plans'),
};
