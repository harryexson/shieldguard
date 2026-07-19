// Canonical API contract — single source of truth for endpoint paths and the
// shared request/response shape used by the backend, mobile and office apps.
// Endpoint paths are defined once here so a route rename propagates everywhere.

const API_BASE_PATH = '/api';

const ENDPOINTS = {
  health: `${API_BASE_PATH}/health`,
  threats: `${API_BASE_PATH}/threats`,
  threatFeed: `${API_BASE_PATH}/threats/feed`,
  threatCheck: (pkg) => `${API_BASE_PATH}/threats/check/${pkg}`,
  networkCheck: (domain) => `${API_BASE_PATH}/network/check/${domain}`,
  scan: `${API_BASE_PATH}/scan`,
  scanHistory: `${API_BASE_PATH}/scan/history`,
  alerts: `${API_BASE_PATH}/alerts`,
  settings: `${API_BASE_PATH}/settings`,
  stats: `${API_BASE_PATH}/stats`,
  features: `${API_BASE_PATH}/features`,
  me: (deviceId) => `${API_BASE_PATH}/me${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`,
  billingPlans: `${API_BASE_PATH}/billing/plans`,
  familyAdmin: `${API_BASE_PATH}/family/admin`,
  incidentsAdmin: `${API_BASE_PATH}/incidents/admin`,
  threatDashboard: `${API_BASE_PATH}/threat-dashboard`,
  aiReportsAdmin: `${API_BASE_PATH}/ai/reports/admin`,
  auditAdmin: `${API_BASE_PATH}/audit/admin`,
};

module.exports = { API_BASE_PATH, ENDPOINTS };
