import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../constants';
import { dashboardApi, DevicePosture, DashboardResult } from '../services/api';

function riskColor(level: string): string {
  switch (level) {
    case 'low': return COLORS.safe;
    case 'medium': return COLORS.warning;
    default: return COLORS.danger;
  }
}

export function ThreatDashboardScreen() {
  const [posture, setPosture] = useState<DevicePosture>({
    rooted: false,
    developerMode: __DEV__,
    vpnActive: false,
    screenLock: true,
    biometrics: false,
    osUpdates: true,
    appIntegrity: true,
  });
  const [result, setResult] = useState<DashboardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync()
      .then((h) => (h ? LocalAuthentication.isEnrolledAsync() : Promise.resolve(false)))
      .then((enrolled) => setPosture((p) => ({ ...p, biometrics: !!enrolled })))
      .catch(() => undefined);
  }, []);

  const toggle = (key: keyof DevicePosture) => setPosture((p) => ({ ...p, [key]: !p[key] }));

  const runCheck = async () => {
    setLoading(true);
    setChecked(false);
    try {
      const r = await dashboardApi.check(posture);
      setResult(r);
      setChecked(true);
    } catch (e: any) {
      Alert.alert('Check failed', e?.message || 'Could not reach the threat dashboard.');
    } finally { setLoading(false); }
  };

  const rows: { key: keyof DevicePosture; label: string; note: string }[] = [
    { key: 'rooted', label: 'Device rooted / jailbroken', note: 'Assumed false — true root detection needs a native security lib.' },
    { key: 'developerMode', label: 'Developer mode', note: __DEV__ ? 'On (debug build)' : 'Off' },
    { key: 'vpnActive', label: 'VPN active', note: 'Unknown from JS — set if you have a VPN on.' },
    { key: 'screenLock', label: 'Screen lock enabled', note: 'Assumed true — verify in OS settings.' },
    { key: 'biometrics', label: 'Biometrics enrolled', note: 'Detected via expo-local-authentication.' },
    { key: 'osUpdates', label: 'OS up to date', note: 'Unknown from JS — set if fully updated.' },
    { key: 'appIntegrity', label: 'App integrity OK', note: 'ShieldGuard itself is unmodified.' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📊</Text>
        <Text style={styles.title}>Threat Dashboard</Text>
        <Text style={styles.subtitle}>Best-effort device posture check sent to your backend for scoring.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Posture (self-reported)</Text>
        {rows.map((r) => (
          <View key={r.key} style={styles.featureItem}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureName}>{r.label}</Text>
              <Text style={styles.featureDesc}>{r.note}</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, posture[r.key] ? styles.toggleOn : styles.toggleOff]}
              onPress={() => toggle(r.key)}
            >
              <Text style={[styles.toggleText, posture[r.key] ? { color: COLORS.primary } : { color: COLORS.textSecondary }]}>
                {posture[r.key] ? 'YES' : 'NO'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={runCheck}>
        <Text style={styles.primaryButtonText}>{loading ? 'Checking…' : 'Run Posture Check'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={COLORS.safe} style={{ marginTop: 16 }} />}

      {result && checked && (
        <View style={[styles.scoreCard, { borderColor: riskColor(result.riskLevel) }]}>
          <Text style={styles.scoreLabel}>Security Score</Text>
          <Text style={[styles.scoreValue, { color: riskColor(result.riskLevel) }]}>{result.score}/100</Text>
          <Text style={[styles.riskBadge, { color: riskColor(result.riskLevel) }]}>Risk: {result.riskLevel.toUpperCase()}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${result.score}%`, backgroundColor: riskColor(result.riskLevel) }]} />
          </View>
          <Text style={styles.recTitle}>Recommendations</Text>
          {result.recommendations.length === 0 && <Text style={styles.recItem}>No issues — posture looks good.</Text>}
          {result.recommendations.map((rec, i) => (
            <Text key={i} style={styles.recItem}>• {rec}</Text>
          ))}
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          This screen reports posture that the app can observe from JavaScript. Real root/jailbreak detection and live VPN state require native code and are honestly marked as assumptions above.
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
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  featureItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  featureInfo: { flex: 1, marginRight: 12 },
  featureName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  featureDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  toggle: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1 },
  toggleOn: { backgroundColor: COLORS.safe },
  toggleOff: { backgroundColor: COLORS.primary, borderColor: COLORS.border },
  toggleText: { fontSize: 12, fontWeight: 'bold' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  scoreCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 2, alignItems: 'center' },
  scoreLabel: { fontSize: 12, color: COLORS.textSecondary },
  scoreValue: { fontSize: 40, fontWeight: 'bold', marginTop: 4 },
  riskBadge: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  barTrack: { width: '100%', height: 10, backgroundColor: COLORS.primary, borderRadius: 5, marginTop: 14, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  recTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 16, alignSelf: 'flex-start' },
  recItem: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18, alignSelf: 'flex-start' },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
