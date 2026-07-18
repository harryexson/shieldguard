import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Alert, AppState } from 'react-native';
import { clearLocalData } from '../services/crypto';
import { incidentsApi } from '../services/api';
import { getBatteryLevel } from '../services/deviceInfo';

interface PanicContextType {
  isPanicked: boolean;
  triggerPanic: () => Promise<void>;
  resetPanic: () => void;
  // Timed key-destruction
  destructureMinutes: number | null;
  armDestruction: (minutes: 30 | 60) => void;
  cancelDestruction: () => void;
  remainingMs: number | null;
}

const PanicContext = createContext<PanicContextType | undefined>(undefined);

export function PanicProvider({ children }: { children: ReactNode }) {
  const [isPanicked, setIsPanicked] = useState(false);
  const [destructionAt, setDestructionAt] = useState<number | null>(null);

  const triggerPanic = useCallback(async () => {
    setIsPanicked(true);
    // Best-effort incident report.
    try {
      const battery = await getBatteryLevel();
      await incidentsApi.create({ type: 'panic', battery, note: 'Panic Lock triggered' });
    } catch { /* ignore network failure — local lock is what matters */ }
    // Best-effort: attempt to clear clipboard.
    try {
      const { Clipboard } = require('react-native');
      Clipboard.setString('');
    } catch { /* ignore */ }
  }, []);

  const resetPanic = useCallback(() => setIsPanicked(false), []);

  const armDestruction = useCallback((minutes: 30 | 60) => {
    setDestructionAt(Date.now() + minutes * 60 * 1000);
  }, []);

  const cancelDestruction = useCallback(() => setDestructionAt(null), []);

  useEffect(() => {
    if (!destructionAt) return;
    const interval = setInterval(async () => {
      if (Date.now() >= destructionAt) {
        clearInterval(interval);
        setDestructionAt(null);
        await clearLocalData();
        setIsPanicked(true);
        Alert.alert('Keys destroyed', 'Timed key-destruction expired. Local data wiped and vault locked.');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [destructionAt]);

  const remainingMs = destructionAt ? Math.max(0, destructionAt - Date.now()) : null;

  return (
    <PanicContext.Provider
      value={{ isPanicked, triggerPanic, resetPanic, destructureMinutes: destructionAt ? Math.ceil((destructionAt - Date.now()) / 60000) : null, armDestruction, cancelDestruction, remainingMs }}
    >
      {children}
    </PanicContext.Provider>
  );
}

export function usePanic(): PanicContextType {
  const ctx = useContext(PanicContext);
  if (ctx === undefined) throw new Error('usePanic must be used within a PanicProvider');
  return ctx;
}

export { PanicContext };
