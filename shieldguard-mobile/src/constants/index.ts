export const COLORS = {
  primary: '#0A1628',
  secondary: '#162447',
  accent: '#1F4068',
  safe: '#00D9A5',
  warning: '#FFB800',
  danger: '#FF4757',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  card: '#1F2937',
  border: '#374151',
  tabBar: '#0D1B2A',
};

export const THREAT_LEVELS = {
  safe: '#00D9A5',
  warning: '#FFB800',
  danger: '#FF4757',
  critical: '#FF4757',
};

// Points at the ShieldGuard backend. The backend runs on PORT 3000 locally.
// Change this single value to point the app at a LAN IP or hosted URL, e.g.
// 'http://192.168.1.20:3000/api' for a physical device on the same network,
// or your production URL. No secrets are stored here.
export const API_BASE_URL = 'http://localhost:3000/api';

export const SCAN_INTERVALS = [
  { label: 'Every hour', value: 3600000 },
  { label: 'Every 6 hours', value: 21600000 },
  { label: 'Every 12 hours', value: 43200000 },
  { label: 'Daily', value: 86400000 },
];

export const DANGEROUS_PERMISSIONS = [
  'android.permission.READ_SMS',
  'android.permission.SEND_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.READ_CONTACTS',
  'android.permission.WRITE_CONTACTS',
  'android.permission.READ_CALL_LOG',
  'android.permission.RECEIVE_CALL_LOG',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_PHONE_STATE',
  'android.permission.CALL_PHONE',
  'android.permission.PROCESS_OUTGOING_CALLS',
  'android.permission.READ_CALENDAR',
  'android.permission.WRITE_CALENDAR',
  'android.permission.BIND_ACCESSIBILITY_SERVICE',
  'android.permission.BIND_DEVICE_ADMIN',
  'android.permission.BIND_INPUT_METHOD',
];