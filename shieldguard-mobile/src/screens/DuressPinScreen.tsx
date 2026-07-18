import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';

export function DuressPinScreen() {
  const { setDuressPins, duressConfigured, hasPin } = useVault();
  const [normal, setNormal] = useState('');
  const [duress, setDuress] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!/^\d{4,12}$/.test(normal)) { Alert.alert('Invalid', 'Normal PIN must be 4–12 digits.'); return; }
    if (!/^\d{4,12}$/.test(duress)) { Alert.alert('Invalid', 'Duress PIN must be 4–12 digits.'); return; }
    if (normal === duress) { Alert.alert('Invalid', 'The two PINs must be different.'); return; }
    if (confirm && confirm !== normal) { Alert.alert('Mismatch', 'Confirmation does not match the normal PIN.'); return; }
    setBusy(true);
    try {
      await setDuressPins(normal, duress);
      Alert.alert('Duress PIN set', 'When you unlock with the duress PIN, a benign decoy vault opens and a silent incident is reported.');
      setNormal(''); setDuress(''); setConfirm('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save duress PINs.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🕵️</Text>
        <Text style={styles.title}>Duress PIN</Text>
        <Text style={styles.subtitle}>
          Set two PINs: your normal PIN opens the real vault; a separate duress PIN opens a decoy vault and silently reports a duress incident.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={[styles.statusValue, { color: duressConfigured ? COLORS.safe : COLORS.warning }]}>
          {duressConfigured ? 'CONFIGURED' : 'NOT SET'}
        </Text>
      </View>

      <Text style={styles.fieldLabel}>Normal PIN (opens real vault)</Text>
      <TextInput style={styles.input} placeholder="4–12 digit PIN" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" secureTextEntry maxLength={12} value={normal} onChangeText={setNormal} />

      <Text style={styles.fieldLabel}>Duress PIN (opens decoy + alerts)</Text>
      <TextInput style={styles.input} placeholder="Different 4–12 digit PIN" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" secureTextEntry maxLength={12} value={duress} onChangeText={setDuress} />

      <Text style={styles.fieldLabel}>Confirm normal PIN</Text>
      <TextInput style={styles.input} placeholder="Re-enter normal PIN" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" secureTextEntry maxLength={12} value={confirm} onChangeText={setConfirm} />

      <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={handleSave}>
        <Text style={styles.primaryButtonText}>{busy ? 'Saving…' : 'Save Duress PINs'}</Text>
      </TouchableOpacity>

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          The duress PIN is stored only as a hash on this device. Entering it never shows any indication that decoy mode is active — it is designed to look identical to a normal unlock.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  statusCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statusLabel: { fontSize: 12, color: COLORS.textSecondary },
  statusValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  fieldLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, width: '100%' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
