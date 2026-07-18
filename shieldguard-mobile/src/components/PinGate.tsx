import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';

interface PinGateProps {
  title?: string;
  subtitle?: string;
  onLocked?: () => void; // called when locked content should render
}

// A reusable PIN/biometric gate for vault-related screens. When locked it shows
// a PIN prompt; when unlocked it renders its children. Honors duress detection
// via VaultContext.unlock (which flips mode to 'decoy' on the duress PIN).
export function PinGate({ title = 'Vault Locked', subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) {
  const { isUnlocked, unlock, hasPin } = useVault();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    if (!isUnlocked) {
      LocalAuthentication.hasHardwareAsync()
        .then((h) => (h ? LocalAuthentication.supportedAuthenticationTypesAsync() : Promise.resolve([])))
        .then((types) => setBiometricAvailable((types as unknown[]).length > 0))
        .catch(() => setBiometricAvailable(false));
    }
  }, [isUnlocked]);

  const handleUnlock = async () => {
    setError(null);
    const ok = await unlock(pin);
    if (!ok) {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock ShieldGuard vault' });
      if (result.success) {
        // Biometric success reuses the stored normal PIN if cached, else we
        // cannot recover the PIN from biometrics — require PIN on first use.
        const cached = await import('../services/crypto').then((m) => m.readUnlockToken());
        if (cached) {
          const ok = await unlock(cached);
          if (!ok) setError('Stored session invalid — enter PIN.');
        } else {
          setError('Biometrics verified. Please also enter your PIN once to decrypt.');
        }
      }
    } catch {
      // cancelled
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.centerState}>
        <Text style={styles.bigIcon}>🔒</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle || 'Enter your PIN to decrypt this content on-device.'}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
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
        {biometricAvailable && !hasPin && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBiometric}>
            <Text style={styles.secondaryButtonText}>Use Biometrics</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.honestNote}>
          Encrypted on this device. ShieldGuard cannot read it.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 480 },
  bigIcon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  errorText: { fontSize: 13, color: COLORS.danger, marginTop: 12, textAlign: 'center' },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 360,
  },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8, width: '100%', maxWidth: 360, alignItems: 'center' },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  secondaryButton: { backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 12, borderWidth: 1, borderColor: COLORS.accent, width: '100%', maxWidth: 360, alignItems: 'center' },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  honestNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 20, textAlign: 'center', fontStyle: 'italic' },
});
