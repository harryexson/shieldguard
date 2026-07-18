import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hashPin, secureGet, secureSet, clearUnlockToken, cacheUnlockToken } from '../services/crypto';
import { incidentsApi } from '../services/api';
import { auditLog } from '../services/auditLog';

type Mode = 'real' | 'decoy';

interface VaultContextType {
  isUnlocked: boolean;
  pin: string | null; // in-memory only, never persisted
  mode: Mode;
  hasPin: boolean;
  duressConfigured: boolean;
  unlock: (enteredPin: string) => Promise<boolean>;
  lock: () => void;
  setPin: (pin: string) => Promise<void>; // first-time PIN setup
  setDuressPins: (normal: string, duress: string) => Promise<void>;
}

const NORMAL_PIN_HASH_KEY = 'shieldguard_vault_pin_hash';
const DURESS_PIN_HASH_KEY = 'shieldguard_vault_duress_hash';
const DURESS_MARKER_KEY = 'shieldguard_vault_duress_marker';

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPinState] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('real');
  const [hasPin, setHasPin] = useState(false);
  const [duressConfigured, setDuressConfigured] = useState(false);

  useEffect(() => {
    (async () => {
      const normal = await secureGet(NORMAL_PIN_HASH_KEY);
      setHasPin(!!normal);
      const duress = await secureGet(DURESS_PIN_HASH_KEY);
      setDuressConfigured(!!duress);
    })();
  }, []);

  const setPin = useCallback(async (newPin: string) => {
    if (!/^\d{4,12}$/.test(newPin)) {
      throw new Error('PIN must be 4–12 digits.');
    }
    await secureSet(NORMAL_PIN_HASH_KEY, await hashPin(newPin));
    setHasPin(true);
    setPinState(newPin);
    setIsUnlocked(true);
    setMode('real');
    await cacheUnlockToken(newPin).catch(() => undefined);
  }, []);

  const setDuressPins = useCallback(async (normal: string, duress: string) => {
    if (!/^\d{4,12}$/.test(normal) || !/^\d{4,12}$/.test(duress)) {
      throw new Error('PINs must be 4–12 digits.');
    }
    if (normal === duress) {
      throw new Error('The duress PIN must differ from your normal PIN.');
    }
    const normalHash = await hashPin(normal);
    const duressHash = await hashPin(duress);
    // Marker records which hash corresponds to the duress PIN.
    await secureSet(NORMAL_PIN_HASH_KEY, normalHash);
    await secureSet(DURESS_PIN_HASH_KEY, duressHash);
    await secureSet(DURESS_MARKER_KEY, duressHash);
    setHasPin(true);
    setDuressConfigured(true);
  }, []);

  const unlock = useCallback(async (enteredPin: string): Promise<boolean> => {
    const normalHash = await secureGet(NORMAL_PIN_HASH_KEY);
    if (!normalHash) {
      await setPin(enteredPin);
      return true;
    }
    const enteredHash = await hashPin(enteredPin);
    const duressHash = await secureGet(DURESS_PIN_HASH_KEY);
    const marker = await secureGet(DURESS_MARKER_KEY);

    if (duressHash && marker && enteredHash === duressHash) {
      // Duress PIN entered: open decoy vault silently, report incident.
      setPinState(enteredPin);
      setMode('decoy');
      setIsUnlocked(true);
      incidentsApi.create({ type: 'duress', note: 'Silent duress unlock' }).catch(() => undefined);
      return true;
    }
    if (enteredHash === normalHash) {
      setPinState(enteredPin);
      setMode('real');
      setIsUnlocked(true);
      await cacheUnlockToken(enteredPin).catch(() => undefined);
      auditLog.add('vault_unlock_success').catch(() => undefined);
      return true;
    }
    auditLog.add('vault_unlock_failed').catch(() => undefined);
    return false;
  }, [setPin]);

  const lock = useCallback(() => {
    setPinState(null);
    setIsUnlocked(false);
    setMode('real');
    clearUnlockToken().catch(() => undefined);
  }, []);

  return (
    <VaultContext.Provider
      value={{ isUnlocked, pin, mode, hasPin, duressConfigured, unlock, lock, setPin, setDuressPins }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultContextType {
  const ctx = useContext(VaultContext);
  if (ctx === undefined) throw new Error('useVault must be used within a VaultProvider');
  return ctx;
}

export { VaultContext };
