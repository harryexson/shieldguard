import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants';
import { usePanic } from '../context/PanicContext';
import { useVault } from '../context/VaultContext';
import { incidentsApi } from '../services/api';

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function PanicLockScreen() {
  const { isPanicked, triggerPanic, resetPanic, armDestruction, cancelDestruction, remainingMs } = usePanic();
  const { lock } = useVault();

  const doPanic = async () => {
    Alert.alert(
      'Trigger Panic Lock?',
      'This locks the vault immediately and reports a silent panic incident. Timed key-destruction can also auto-wipe local data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Panic Lock',
          style: 'destructive',
          onPress: async () => {
            await triggerPanic();
            lock(); // force re-auth
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>{isPanicked ? '🚨' : '🛡️'}</Text>
        <Text style={styles.title}>Panic Lock</Text>
        <Text style={styles.subtitle}>
          {isPanicked ? 'Panic mode active — vault is locked.' : 'Instantly lock your vault and signal distress.'}
        </Text>
      </View>

      <View style={[styles.statusCard, isPanicked ? styles.statusCardDanger : styles.statusCardSafe]}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={[styles.statusValue, isPanicked ? { color: COLORS.danger } : { color: COLORS.safe }]}>
          {isPanicked ? 'LOCKED' : 'ARMED'}
        </Text>
      </View>

      {isPanicked ? (
        <TouchableOpacity style={styles.primaryButton} onPress={resetPanic}>
          <Text style={styles.primaryButtonText}>Reset Panic (re-enter vault)</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.danger }]} onPress={doPanic}>
          <Text style={[styles.primaryButtonText, { color: COLORS.text }]}>🚨 Trigger Panic Lock</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timed Key-Destruction</Text>
        <Text style={styles.sectionDesc}>
          Optionally arm a countdown that, on expiry, wipes all local ShieldGuard data and forces a relock. This is a last-resort anti-confiscation measure.
        </Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.rowBtn} onPress={() => armDestruction(30)}>
            <Text style={styles.rowBtnText}>Arm 30 min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rowBtn} onPress={() => armDestruction(60)}>
            <Text style={styles.rowBtnText}>Arm 60 min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rowBtn, { backgroundColor: COLORS.border }]} onPress={cancelDestruction}>
            <Text style={styles.rowBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>Destruction in</Text>
          <Text style={styles.countdownValue}>{formatMs(remainingMs)}</Text>
        </View>
      </View>

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          Panic Lock locks the app locally and reports an incident to your backend. App-preview hiding depends on OS support and is best-effort. True remote wipe of a confiscated device is not possible from the app alone.
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
  statusCard: { borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1 },
  statusCardSafe: { backgroundColor: COLORS.safe + '15', borderColor: COLORS.safe + '40' },
  statusCardDanger: { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger + '40' },
  statusLabel: { fontSize: 12, color: COLORS.textSecondary },
  statusValue: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  sectionDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 12, marginHorizontal: 4, alignItems: 'center' },
  rowBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 13 },
  countdownCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, marginTop: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  countdownLabel: { fontSize: 12, color: COLORS.textSecondary },
  countdownValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.warning, marginTop: 4 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
