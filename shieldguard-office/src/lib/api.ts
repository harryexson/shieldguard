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

export const officeApi = {
  health: () => api.get<{ status: string }>('/health'),
  stats: () => api.get<{ totalThreats: number; suspiciousDomains: number; alertsCount: number; scansPerformed: number; totalAlerts: number; lastScan: number | null }>('/stats'),
  threats: () => api.get<any[]>('/threats'),
  alerts: () => api.get<any[]>('/alerts'),
};
