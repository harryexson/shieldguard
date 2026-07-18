import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';
import { auditLog, AuditLogEntry } from '../services/auditLog';
import { auditApi } from '../services/api';

function timeAgo(at: number): string {
  const diff = Date.now() - at;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(at).toLocaleString();
}

export function AuditLogScreen() {
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await auditLog.list();
    setEvents(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const syncToServer = async () => {
    setSyncing(true);
    try {
      for (const e of events) {
        await auditApi.append(e.type).catch(() => undefined);
      }
      // refresh server-side list is also available; we keep local as source of truth.
      await auditApi.list().catch(() => undefined);
    } finally {
      setSyncing(false);
    }
  };

  const clear = async () => {
    try {
      await (await import('@react-native-async-storage/async-storage')).default.removeItem('shieldguard_audit_log');
    } catch {
      // ignore
    }
    setEvents([]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.safe} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title}>Audit Log</Text>
        <Text style={styles.subtitle}>A local, on-device trail of important events.</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} disabled={syncing} onPress={syncToServer}>
        <Text style={styles.primaryButtonText}>{syncing ? 'Syncing…' : 'Sync to server'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.danger }]} onPress={clear}>
        <Text style={styles.primaryButtonText}>Clear local log</Text>
      </TouchableOpacity>

      {events.length === 0 ? (
        <Text style={styles.empty}>No events recorded yet.</Text>
      ) : (
        events.map((e) => (
          <View key={e.id} style={styles.row}>
            <View style={styles.dot} />
            <View style={styles.info}>
              <Text style={styles.type}>{e.type}</Text>
              <Text style={styles.time}>{timeAgo(e.at)}</Text>
            </View>
          </View>
        ))
      )}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          This is a local audit trail stored on your device. "Sync to server" mirrors the same event types to the backend (best-effort). Clearing the app data erases this log.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 40, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  row: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.safe, marginRight: 12 },
  info: { flex: 1 },
  type: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  time: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  honest: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.warning + '40' },
  honestText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
