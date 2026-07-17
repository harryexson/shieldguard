import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppInfo, ScanResult, SecurityAudit, Alert, Settings, NetworkConnection, DeviceInfo, AppStats } from '../types';

interface SecurityState {
  isScanning: boolean;
  lastScan: ScanResult | null;
  securityAudit: SecurityAudit | null;
  alerts: Alert[];
  settings: Settings;
  networkConnections: NetworkConnection[];
  deviceInfo: DeviceInfo | null;
  stats: AppStats;
}

type SecurityAction =
  | { type: 'START_SCAN' }
  | { type: 'COMPLETE_SCAN'; payload: ScanResult }
  | { type: 'SET_SECURITY_AUDIT'; payload: SecurityAudit }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'MARK_ALERT_READ'; payload: string }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_NETWORK_CONNECTIONS'; payload: NetworkConnection[] }
  | { type: 'SET_DEVICE_INFO'; payload: DeviceInfo }
  | { type: 'SET_STATS'; payload: AppStats };

const initialState: SecurityState = {
  isScanning: false,
  lastScan: null,
  securityAudit: null,
  alerts: [],
  settings: {
    autoScanEnabled: false,
    scanInterval: 86400000,
    realTimeMonitoring: true,
    notificationsEnabled: true,
    threatAlertsEnabled: true,
    networkMonitoringEnabled: true,
    backgroundScanning: false,
  },
  networkConnections: [],
  deviceInfo: null,
  stats: {
    totalApps: 0,
    safeApps: 0,
    warningApps: 0,
    dangerousApps: 0,
    lastScan: null,
  },
};

function securityReducer(state: SecurityState, action: SecurityAction): SecurityState {
  switch (action.type) {
    case 'START_SCAN':
      return { ...state, isScanning: true };
    
    case 'COMPLETE_SCAN':
      const safeApps = action.payload.apps.filter(a => a.threatLevel === 'safe').length;
      const warningApps = action.payload.apps.filter(a => a.threatLevel === 'warning').length;
      const dangerousApps = action.payload.apps.filter(a => a.threatLevel === 'danger' || a.threatLevel === 'critical').length;
      return {
        ...state,
        isScanning: false,
        lastScan: action.payload,
        stats: {
          totalApps: action.payload.appsScanned,
          safeApps,
          warningApps,
          dangerousApps,
          lastScan: action.payload.timestamp,
        },
      };
    
    case 'SET_SECURITY_AUDIT':
      return { ...state, securityAudit: action.payload };
    
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    
    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] };
    
    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.payload ? { ...a, read: true } : a
        ),
      };
    
    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(a => a.id !== action.payload),
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    
    case 'SET_NETWORK_CONNECTIONS':
      return { ...state, networkConnections: action.payload };
    
    case 'SET_DEVICE_INFO':
      return { ...state, deviceInfo: action.payload };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    default:
      return state;
  }
}

interface SecurityContextType {
  state: SecurityState;
  dispatch: React.Dispatch<SecurityAction>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(securityReducer, initialState);
  
  return (
    <SecurityContext.Provider value={{ state, dispatch }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

export function useSettings() {
  const { state } = useSecurity();
  return state.settings;
}

export function useAlerts() {
  const { state } = useSecurity();
  return state.alerts;
}

export function useStats() {
  const { state } = useSecurity();
  return state.stats;
}