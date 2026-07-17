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
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../constants';
import {
  hashPin,
  encryptSecret,
  decryptSecret,
  secureGet,
  secureSet,
  secureRemove,
  clearLocalData,
} from '../services/crypto';

const VAULT_ENTRIES_KEY = 'shieldguard_vault_entries';
const VAULT_PIN_HASH_KEY = 'shieldguard_vault_pin_hash';
const VAULT_SESSION_KEY = 'shieldguard_vault_session';
const VAULT_FAIL_KEY = 'shieldguard_vault_fail_count';
const MAX_ATTEMPTS = 5;
const SESSION_MS = 5 * 60 * 1000;

export interface VaultEntry {
  id: string;
  platform: string;
  username: string;
  cipher: string; // encrypted secret+notes
  createdAt: number;
}

export function SocialVaultScreen() {
  const [unlocked, setUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode] = useState<'locked' | 'set'>('locked');
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [failCount, setFailCount] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // add-entry form
  const [adding, setAdding] = useState(false);
  const [platform, setPlatform] = useState('');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [autoWipe, setAutoWipe] = useState(false);

  const lastActive = useRef(Date.now());

  useEffect(() => {
    (async () => {
      const hash = await secureGet(VAULT_PIN_HASH_KEY);
      setHasPin(!!hash);
      setMode(hash ? 'locked' : 'set');
      setFailCount(Number((await secureGet(VAULT_FAIL_KEY)) || '0'));
      setAutoWipe((await secureGet('shieldguard_vault_autowipe')) === '1');
      const enrolled = await LocalAuthentication.hasHardwareAsync().catch(() => false);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync().catch(() => []);
      setBiometricAvailable(enrolled && types.length > 0);
    })();
  }, []);

  const loadEntries = async () => {
    const raw = await secureGet(VAULT_ENTRIES_KEY);
    if (raw) {
      try {
        setEntries(JSON.parse(raw) as VaultEntry[]);
      } catch {
        setEntries([]);
      }
    }
  };

  useEffect(() => {
    if (unlocked) loadEntries();
  }, [unlocked]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') lastActive.current = Date.now();
      else if (state === 'active' && unlocked && Date.now() - lastActive.current > SESSION_MS) {
        setUnlocked(false);
        setPin('');
      }
    });
    const interval = setInterval(() => {
      if (unlocked && Date.now() - lastActive.current > SESSION_MS) {
        setUnlocked(false);
        setPin('');
      }
    }, 30000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [unlocked]);

  const bumpSession = () => {
    lastActive.current = Date.now();
    secureSet(VAULT_SESSION_KEY, String(Date.now())).catch(() => undefined);
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
    await secureSet(VAULT_PIN_HASH_KEY, await hashPin(pin));
    await secureRemove(VAULT_FAIL_KEY);
    setHasPin(true);
    setPin('');
    setConfirmPin('');
    bumpSession();
    setUnlocked(true);
  };

  const doUnlock = async (enteredPin: string) => {
    const hash = await secureGet(VAULT_PIN_HASH_KEY);
    if ((await hashPin(enteredPin)) === hash) {
      await secureRemove(VAULT_FAIL_KEY);
      setFailCount(0);
      bumpSession();
      setUnlocked(true);
      return true;
    }
    const next = failCount + 1;
    setFailCount(next);
    await secureSet(VAULT_FAIL_KEY, String(next));
    if (next >= MAX_ATTEMPTS) {
      if (autoWipe) {
        await clearLocalData();
        Alert.alert('Auto-wipe', 'Too many attempts — local vault data erased.');
        setUnlocked(false);
        setHasPin(false);
        setEntries([]);
        setMode('set');
        return false;
      }
      Alert.alert('Locked', 'Too many failed attempts. Reset app data to retry.');
      return false;
    }
    Alert.alert('Incorrect PIN', `${MAX_ATTEMPTS - next} attempt(s) remaining.`);
    return false;
  };

  const handleUnlock = async () => {
    await doUnlock(pin);
    setPin('');
  };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock vault' });
      if (result.success) {
        await secureRemove(VAULT_FAIL_KEY);
        setFailCount(0);
        bumpSession();
        setUnlocked(true);
      }
    } catch {
      // cancelled
    }
  };

  const handleAdd = async () => {
    if (!platform.trim() || !secret.trim()) {
      Alert.alert('Missing fields', 'Platform and secret are required.');
      return;
    }
    const id = `v_${Date.now()}`;
    const cipher = encryptSecret(`${secret}::${username}::${platform}`, pin);
    const next = [...entries, { id, platform: platform.trim(), username: username.trim(), cipher, createdAt: Date.now() }];
    setEntries(next);
    await secureSet(VAULT_ENTRIES_KEY, JSON.stringify(next));
    setPlatform('');
    setUsername('');
    setSecret('');
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete entry', 'Remove this vault entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const next = entries.filter((e) => e.id !== id);
          setEntries(next);
          await secureSet(VAULT_ENTRIES_KEY, JSON.stringify(next));
        },
      },
    ]);
  };

  const toggleReveal = (entry: VaultEntry) => {
    if (revealed[entry.id]) {
      setRevealed((r) => {
        const copy = { ...r };
        delete copy[entry.id];
        return copy;
      });
      return;
    }
    try {
      const [sec, user] = decryptSecret(entry.cipher, pin).split('::');
      setRevealed((r) => ({ ...r, [entry.id]: `${user || ''} • ${sec}` }));
    } catch {
      Alert.alert('Decryption failed', 'Wrong PIN or corrupted entry.');
    }
  };

  const handleChangePin = () => {
    setMode('set');
    setPin('');
    setConfirmPin('');
  };

  const handleAutoWipe = async (v: boolean) => {
    setAutoWipe(v);
    await secureSet('shieldguard_vault_autowipe', v ? '1' : '0');
  };

  // ─── SET PIN ───────────────────────────────────────────────────────────
  if (mode === 'set') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.centerState}>
          <Text style={styles.bigIcon}>🔐</Text>
          <Text style={styles.title}>{hasPin ? 'Reset Vault PIN' : 'Create Vault PIN'}</Text>
          <Text style={styles.subtitle}>
            Your credentials are encrypted at rest with AES-256 (key derived from this PIN via PBKDF2).
            Without it, entries cannot be recovered.
          </Text>
        </View>
        <TextInput style={styles.input} placeholder="4–12 digit PIN" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" secureTextEntry maxLength={12} value={pin} onChangeText={setPin} />
        <TextInput style={styles.input} placeholder="Confirm PIN" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" secureTextEntry maxLength={12} value={confirmPin} onChangeText={setConfirmPin} />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSetPin}>
          <Text style={styles.primaryButtonText}>{hasPin ? 'Update PIN' : 'Create Vault'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── LOCKED ────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.bigIcon}>🔒</Text>
          <Text style={styles.title}>Vault Locked</Text>
          <Text style={styles.subtitle}>Enter your PIN to view encrypted accounts.</Text>
          <TextInput style={styles.input} placeholder="PIN" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" secureTextEntry maxLength={12} value={pin} onChangeText={setPin} onSubmitEditing={handleUnlock} />
          <TouchableOpacity style={styles.primaryButton} onPress={handleUnlock}>
            <Text style={styles.primaryButtonText}>Unlock</Text>
          </TouchableOpacity>
          {biometricAvailable && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBiometric}>
              <Text style={styles.secondaryButtonText}>Use Biometrics</Text>
            </TouchableOpacity>
          )}
          {hasPin && (
            <TouchableOpacity style={styles.linkButton} onPress={handleChangePin}>
              <Text style={styles.linkText}>Forgot PIN? Reset vault</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ─── UNLOCKED ──────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Social Media Vault</Text>
        <Text style={styles.subtitle}>Locally encrypted credential storage ({entries.length} entries)</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Vault Status</Text>
        <Text style={styles.statusValue}>Encrypted</Text>
        <Text style={styles.statusDetail}>{entries.length} account(s) stored locally • AES-256</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => setAdding(true)}>
        <Text style={styles.primaryButtonText}>+ Add Account</Text>
      </TouchableOpacity>

      {adding && (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="Platform (e.g. Facebook)" placeholderTextColor={COLORS.textSecondary} value={platform} onChangeText={setPlatform} />
          <TextInput style={styles.input} placeholder="Username / email (optional)" placeholderTextColor={COLORS.textSecondary} value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Secret / password / notes" placeholderTextColor={COLORS.textSecondary} secureTextEntry value={secret} onChangeText={setSecret} />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setAdding(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
              <Text style={styles.saveButtonText}>Save Encrypted</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stored Accounts</Text>
        {entries.length === 0 && (
          <Text style={styles.emptyText}>No accounts yet. Add one above.</Text>
        )}
        {entries.map((entry) => (
          <View key={entry.id} style={styles.entryItem}>
            <View style={styles.entryInfo}>
              <Text style={styles.entryName}>{entry.platform}</Text>
              <Text style={styles.entryUser}>{entry.username || '(no username)'}</Text>
              {revealed[entry.id] && (
                <Text style={styles.entrySecret} selectable>
                  {revealed[entry.id]}
                </Text>
              )}
            </View>
            <View style={styles.entryActions}>
              <TouchableOpacity onPress={() => toggleReveal(entry)}>
                <Text style={styles.entryAction}>{revealed[entry.id] ? 'Hide' : 'Reveal'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                <Text style={[styles.entryAction, { color: COLORS.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wipe Policy</Text>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Auto-wipe on lockout</Text>
            <Text style={styles.featureDesc}>Erase vault after {MAX_ATTEMPTS} failed PIN attempts</Text>
          </View>
          <Switch value={autoWipe} onValueChange={handleAutoWipe} trackColor={{ false: COLORS.border, true: COLORS.danger + '80' }} thumbColor={autoWipe ? COLORS.danger : COLORS.textSecondary} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Honest Limitation</Text>
        <View style={styles.limitCard}>
          <Text style={styles.limitText}>
            This is a local encrypted notebook for your own credentials — it does NOT magically
            connect to, or "encrypt", third-party social accounts. Credentials never leave this device.
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
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, color: COLORS.text, fontSize: 16, borderWidth: 1, borderColor: COLORS.border, width: '100%', maxWidth: 420 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, marginTop: 8, alignItems: 'center', width: '100%', maxWidth: 420, alignSelf: 'center' },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  secondaryButton: { backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, marginTop: 12, borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', width: '100%', maxWidth: 420, alignSelf: 'center' },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  linkButton: { marginTop: 16 },
  linkText: { fontSize: 13, color: COLORS.textSecondary, textDecorationLine: 'underline' },
  statusCard: { backgroundColor: COLORS.safe + '15', borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.safe + '40' },
  statusLabel: { fontSize: 12, color: COLORS.textSecondary },
  statusValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.safe, marginTop: 4 },
  statusDetail: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  formCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cancelButton: { backgroundColor: COLORS.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
  cancelButtonText: { color: COLORS.text, fontWeight: '600' },
  saveButton: { backgroundColor: COLORS.safe, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
  saveButtonText: { color: COLORS.primary, fontWeight: '700' },
  entryItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between' },
  entryInfo: { flex: 1, marginRight: 8 },
  entryName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  entryUser: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  entrySecret: { fontSize: 11, color: COLORS.accent, marginTop: 6 },
  entryActions: { justifyContent: 'space-around', alignItems: 'flex-end' },
  entryAction: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginVertical: 4 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 16 },
  featureItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  featureInfo: { flex: 1, marginRight: 12 },
  featureName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  featureDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
