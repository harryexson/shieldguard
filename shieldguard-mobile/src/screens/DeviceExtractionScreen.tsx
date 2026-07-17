import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  AppState,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../constants';
import {
  hashPin,
  secureGet,
  secureSet,
  secureRemove,
  clearLocalData,
} from '../services/crypto';

const PIN_HASH_KEY = 'shieldguard_extraction_pin_hash';
const FAIL_KEY = 'shieldguard_extraction_fail_count';
const AUTO_WIPE_KEY = 'shieldguard_extraction_autowipe';
const SESSION_KEY = 'shieldguard_extraction_session';
const MAX_ATTEMPTS = 5;
const SESSION_MS = 5 * 60 * 1000; // re-lock after 5 min of inactivity

type Mode = 'locked' | 'set' | 'unlocked' | 'wiped';

export function DeviceExtractionScreen() {
  const [mode, setMode] = useState<Mode>('locked');
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [failCount, setFailCount] = useState(0);
  const [autoWipe, setAutoWipe] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pinLock, setPinLock] = useState(true);
  const [usbBlocking, setUsbBlocking] = useState(true);
  const [bootProtection, setBootProtection] = useState(true);
  const [memoryEncryption, setMemoryEncryption] = useState(true);
  const lastActive = useRef(Date.now());

  useEffect(() => {
    (async () => {
      const hash = await secureGet(PIN_HASH_KEY);
      setHasPin(!!hash);
      setFailCount(Number((await secureGet(FAIL_KEY)) || '0'));
      setAutoWipe((await secureGet(AUTO_WIPE_KEY)) === '1');
      const enrolled = await LocalAuthentication.hasHardwareAsync().catch(() => false);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync().catch(() => []);
      setBiometricAvailable(enrolled && types.length > 0);

      const session = await secureGet(SESSION_KEY);
      const recent = session && Date.now() - Number(session) < SESSION_MS;
      setMode(hash ? (recent ? 'unlocked' : 'locked') : 'set');
    })();
  }, []);

  // Background / inactivity re-lock.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        lastActive.current = Date.now();
      } else if (state === 'active') {
        if (mode === 'unlocked' && Date.now() - lastActive.current > SESSION_MS) {
          setMode('locked');
          setPin('');
        }
      }
    });
    const interval = setInterval(() => {
      if (mode === 'unlocked' && Date.now() - lastActive.current > SESSION_MS) {
        setMode('locked');
        setPin('');
      }
    }, 30000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [mode]);

  const bumpActivity = () => {
    lastActive.current = Date.now();
    secureSet(SESSION_KEY, String(Date.now())).catch(() => undefined);
  };

  const triggerWipe = async () => {
    await clearLocalData();
    setMode('wiped');
  };

  const handleSetPin = async () => {
    if (!/^\d{4,12}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'PIN must be 4–12 digits.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('PIN mismatch', 'The two PINs do not match.');
      return;
    }
    await secureSet(PIN_HASH_KEY, await hashPin(pin));
    await secureRemove(FAIL_KEY);
    setFailCount(0);
    setHasPin(true);
    setPin('');
    setConfirmPin('');
    bumpActivity();
    setMode('unlocked');
  };

  const handleUnlock = async () => {
    const hash = await secureGet(PIN_HASH_KEY);
    if (!hash) {
      setMode('set');
      return;
    }
    const ok = (await hashPin(pin)) === hash;
    if (ok) {
      await secureRemove(FAIL_KEY);
      setFailCount(0);
      setPin('');
      bumpActivity();
      setMode('unlocked');
      return;
    }
    const next = failCount + 1;
    setFailCount(next);
    await secureSet(FAIL_KEY, String(next));
    setPin('');
    if (next >= MAX_ATTEMPTS) {
      if (autoWipe) {
        Alert.alert('Too many attempts', 'Auto-wipe triggered. Local ShieldGuard data cleared.');
        await triggerWipe();
      } else {
        Alert.alert('Locked', `Too many failed attempts (${MAX_ATTEMPTS}). Reset the app data to try again.`);
      }
    } else {
      Alert.alert('Incorrect PIN', `${MAX_ATTEMPTS - next} attempt(s) remaining.`);
    }
  };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock extraction defense',
      });
      if (result.success) {
        await secureRemove(FAIL_KEY);
        setFailCount(0);
        bumpActivity();
        setMode('unlocked');
      }
    } catch {
      // user cancelled
    }
  };

  const handleChangePin = () => {
    setMode('set');
    setPin('');
    setConfirmPin('');
  };

  const handleDisableWipe = async (value: boolean) => {
    setAutoWipe(value);
    await secureSet(AUTO_WIPE_KEY, value ? '1' : '0');
  };

  // ─── WIPED state ───────────────────────────────────────────────────────
  if (mode === 'wiped') {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.bigIcon}>🧨</Text>
          <Text style={styles.title}>Vault Wiped</Text>
          <Text style={styles.subtitle}>
            Local ShieldGuard data was erased after too many failed attempts.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              await secureRemove(PIN_HASH_KEY);
              setHasPin(false);
              setMode('set');
              setPin('');
              setConfirmPin('');
            }}
          >
            <Text style={styles.primaryButtonText}>Set up a new PIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── SET PIN state ─────────────────────────────────────────────────────
  if (mode === 'set') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.centerState}>
          <Text style={styles.bigIcon}>🔐</Text>
          <Text style={styles.title}>{hasPin ? 'Change PIN' : 'Set Extraction PIN'}</Text>
          <Text style={styles.subtitle}>
            This PIN protects your device-extraction defense and encrypted vault.
          </Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="4–12 digit PIN"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric"
          secureTextEntry
          maxLength={12}
          value={pin}
          onChangeText={setPin}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm PIN"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric"
          secureTextEntry
          maxLength={12}
          value={confirmPin}
          onChangeText={setConfirmPin}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSetPin}>
          <Text style={styles.primaryButtonText}>{hasPin ? 'Update PIN' : 'Enable Lock'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── LOCKED state ──────────────────────────────────────────────────────
  if (mode === 'locked') {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.bigIcon}>🔒</Text>
          <Text style={styles.title}>Locked</Text>
          <Text style={styles.subtitle}>
            Enter your extraction PIN to manage device defenses.
          </Text>
          {failCount > 0 && (
            <Text style={styles.lockWarn}>
              {MAX_ATTEMPTS - failCount} attempt(s) remaining
              {autoWipe ? ' — auto-wipe armed' : ''}
            </Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="PIN"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
            secureTextEntry
            maxLength={12}
            value={pin}
            onChangeText={setPin}
            onSubmitEditing={handleUnlock}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleUnlock}>
            <Text style={styles.primaryButtonText}>Unlock</Text>
          </TouchableOpacity>
          {biometricAvailable && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBiometric}>
              <Text style={styles.secondaryButtonText}>Use Biometrics</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ─── UNLOCKED state ────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Device Extraction Protection</Text>
        <Text style={styles.subtitle}>PIN-locked local defense (unlocked)</Text>
      </View>

      <View style={styles.pinCard}>
        <Text style={styles.pinLabel}>Extraction PIN</Text>
        <Text style={styles.pinStatus}>
          Active — {MAX_ATTEMPTS - failCount} failed attempts remaining
        </Text>
        <TouchableOpacity style={styles.pinButton} onPress={handleChangePin}>
          <Text style={styles.pinButtonText}>Change PIN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pinButton, { backgroundColor: COLORS.danger }]}
          onPress={() => setMode('locked')}
        >
          <Text style={[styles.pinButtonText, { color: COLORS.text }]}>Lock now</Text>
        </TouchableOpacity>
        {biometricAvailable && (
          <TouchableOpacity style={styles.pinButton} onPress={handleBiometric}>
            <Text style={styles.pinButtonText}>Unlock with biometrics</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Protection Features</Text>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Extraction Lock</Text>
            <Text style={styles.featureDesc}>PIN required before any data extraction is permitted</Text>
          </View>
          <Switch value={pinLock} onValueChange={setPinLock} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={pinLock ? COLORS.safe : COLORS.textSecondary} />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>USB Debugging Block</Text>
            <Text style={styles.featureDesc}>Reminds you to disable USB debugging unless unlocked</Text>
          </View>
          <Switch value={usbBlocking} onValueChange={setUsbBlocking} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={usbBlocking ? COLORS.safe : COLORS.textSecondary} />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Boot Loader Protection</Text>
            <Text style={styles.featureDesc}>Guidance to prevent forensic boot into extraction mode</Text>
          </View>
          <Switch value={bootProtection} onValueChange={setBootProtection} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={bootProtection ? COLORS.safe : COLORS.textSecondary} />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Memory Encryption</Text>
            <Text style={styles.featureDesc}>Encourages enabling OS-level storage encryption</Text>
          </View>
          <Switch value={memoryEncryption} onValueChange={setMemoryEncryption} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={memoryEncryption ? COLORS.safe : COLORS.textSecondary} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wipe Policy</Text>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Auto-wipe on lockout</Text>
            <Text style={styles.featureDesc}>
              Erase all local ShieldGuard data after {MAX_ATTEMPTS} failed PIN attempts
            </Text>
          </View>
          <Switch value={autoWipe} onValueChange={handleDisableWipe} trackColor={{ false: COLORS.border, true: COLORS.danger + '80' }} thumbColor={autoWipe ? COLORS.danger : COLORS.textSecondary} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Honest Capability Notice</Text>
        <View style={styles.limitCard}>
          <Text style={styles.limitText}>
            A third-party app cannot truly block a forensic extraction at the hardware level or
            defeat a lawful forensic tool with physical access. ShieldGuard's PIN lock protects the
            app's own local data (vault, settings) and provides guidance — it is not a substitute
            for full-disk encryption and a strong OS passphrase.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 32 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 480 },
  bigIcon: { fontSize: 56, marginBottom: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  lockWarn: { fontSize: 12, color: COLORS.danger, marginTop: 12, textAlign: 'center' },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 360,
  },
  primaryButton: {
    backgroundColor: COLORS.safe,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  pinCard: { backgroundColor: COLORS.safe + '15', borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.safe + '40' },
  pinLabel: { fontSize: 12, color: COLORS.textSecondary },
  pinStatus: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  pinButton: { backgroundColor: COLORS.safe, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, marginTop: 16, width: '100%', alignItems: 'center' },
  pinButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  featureItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  featureInfo: { flex: 1, marginRight: 12 },
  featureName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  featureDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
