import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';

interface PermRow {
  key: string;
  label: string;
  module: string; // name of the expo module that exposes a permission API
  status: 'granted' | 'denied' | 'undetermined' | 'unavailable' | 'checking';
  note: string;
}

function guardRequire(name: string): any | null {
  try { return require(name); } catch { return null; }
}

export function PermissionMonitorScreen() {
  const [rows, setRows] = useState<PermRow[]>([
    { key: 'camera', label: 'Camera', module: 'expo-camera', status: 'checking', note: 'Used by Secure Camera.' },
    { key: 'microphone', label: 'Microphone', module: 'expo-camera', status: 'checking', note: 'Audio recording permissions.' },
    { key: 'location', label: 'Location', module: 'expo-location', status: 'checking', note: 'Fine/coarse position access.' },
    { key: 'contacts', label: 'Contacts', module: 'expo-contacts', status: 'checking', note: 'Read your address book.' },
    { key: 'notifications', label: 'Notifications', module: 'expo-notifications', status: 'checking', note: 'Push and local alerts.' },
    { key: 'bluetooth', label: 'Bluetooth', module: 'expo-bluetooth', status: 'checking', note: 'Nearby device scanning.' },
  ]);

  const check = useCallback(async () => {
    const next = await Promise.all(rows.map(async (r) => {
      const mod = guardRequire(r.module);
      if (!mod || !mod.getPermissionsAsync) {
        return { ...r, status: 'unavailable' as const };
      }
      try {
        const res = await mod.getPermissionsAsync();
        const status: PermRow['status'] = res?.status ?? 'undetermined';
        return { ...r, status };
      } catch {
        return { ...r, status: 'unavailable' as const };
      }
    }));
    setRows(next);
  }, [rows]);

  useEffect(() => { check(); }, [check]);

  const colorFor = (s: PermRow['status']) =>
    s === 'granted' ? COLORS.safe : s === 'denied' ? COLORS.danger : s === 'unavailable' ? COLORS.textSecondary : COLORS.warning;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.title}>Privacy Permission Monitor</Text>
        <Text style={styles.subtitle}>Permissions ShieldGuard itself has been granted on this device.</Text>
      </View>

      <View style={styles.section}>
        {rows.map((r) => (
          <View key={r.key} style={styles.permItem}>
            <View style={styles.permInfo}>
              <Text style={styles.permName}>{r.label}</Text>
              <Text style={styles.permNote}>{r.note}{r.status === 'unavailable' ? ' (module not installed)' : ''}</Text>
            </View>
            <View style={[styles.badge, { borderColor: colorFor(r.status) }]}>
              <Text style={[styles.badgeText, { color: colorFor(r.status) }]}>{r.status.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          Expo cannot enumerate permissions granted to OTHER apps — that requires OS-level access. The list above shows only ShieldGuard's own grants. To review every app's permissions, open your device Settings → Privacy (or App Permissions) and audit each app individually.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 16 },
  permItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  permInfo: { flex: 1, marginRight: 12 },
  permName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  permNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  badge: { borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
