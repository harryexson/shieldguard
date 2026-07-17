import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants';
import { useSubscription } from '../context/SubscriptionContext';
import { FeatureGate } from '../components/FeatureGate';
import { api } from '../services/api';
import { NetworkConnection } from '../types';

function NetworkMonitorBody() {
  const [connections, setConnections] = React.useState<NetworkConnection[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get('/network/connections')
      .then((r) => setConnections(r.data))
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Connection Inspection</Text>
      <Text style={styles.note}>Sample feed from the monitoring engine (representative).</Text>
      {loading && <Text style={styles.note}>Loading…</Text>}
      {connections.map((c) => (
        <View key={c.id} style={styles.connItem}>
          <View style={styles.connInfo}>
            <Text style={styles.connApp}>{c.appName}</Text>
            <Text style={styles.connDomain}>{c.domain} · {c.ip}:{c.port} · {c.protocol}</Text>
          </View>
          <View
            style={[
              styles.badge,
              c.reputation === 'safe' ? styles.badgeSafe : styles.badgeDanger,
            ]}
          >
            <Text style={styles.badgeText}>{c.reputation}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function CellSignalScreen() {
  const { tier } = useSubscription();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.title}>Cellular & Network Protection</Text>
        <Text style={styles.subtitle}>Connection inspection and traffic reputation</Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Honest limitation</Text>
        <Text style={styles.disclaimerText}>
          On stock Android and iOS, a third-party app cannot directly detect IMSI-catcher / Stingray
          hardware or intercept the cellular baseband radio. ShieldGuard focuses on what is verifiable:
          inspecting app network connections and flagging traffic to known malicious infrastructure.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Your plan</Text>
        <Text style={styles.statusValue}>{tier === 'free' ? 'Free' : tier === 'standard' ? 'Standard' : 'Premium'}</Text>
        <Text style={styles.statusDetail}>
          {tier === 'free'
            ? 'Upgrade to inspect app network connections'
            : 'Network connection inspection enabled'}
        </Text>
      </View>

      <FeatureGate feature="network_monitor">
        <NetworkMonitorBody />
      </FeatureGate>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  disclaimer: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '50',
  },
  disclaimerTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.warning, marginBottom: 4 },
  disclaimerText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusLabel: { fontSize: 12, color: COLORS.textSecondary },
  statusValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  statusDetail: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  note: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 8, fontStyle: 'italic' },
  connItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connInfo: { flex: 1, marginRight: 12 },
  connApp: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  connDomain: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeSafe: { backgroundColor: COLORS.safe + '20' },
  badgeDanger: { backgroundColor: COLORS.danger + '20' },
  badgeText: { fontSize: 11, fontWeight: '600', color: COLORS.text },
});
