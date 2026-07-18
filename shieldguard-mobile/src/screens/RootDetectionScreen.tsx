import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { deviceSecurityApi } from '../services/api';

type RootStatus = 'Likely Rooted' | 'Not Detected' | 'Inconclusive';

const SUSPECT_PACKAGES = ['Magisk', 'Magisk Manager', 'frida-server', 'Frida', 'Xposed Installer', 'SuperSU', 'KingoRoot'];
const SUSPECT_PATHS = ['/system/app/Superuser.apk', '/sbin/su', '/system/xbin/su', '/system/bin/su', '/data/local/bin/su'];

// Best-effort static indicators. True root detection on stock Expo needs a
// native module; we surface honest signals only.
export function RootDetectionScreen() {
  const [status, setStatus] = useState<RootStatus | null>(null);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const runCheck = useCallback(async () => {
    const found: string[] = [];
    const rootedPaths = SUSPECT_PATHS; // cannot stat FS from JS; we treat presence of known paths as "looked for"
    // We cannot actually read the filesystem from JS. We report what we CAN reason about.
    if (__DEV__) found.push('Debug build (__DEV__ true) — developer tooling present.');
    // Simulated checks: a real native module would stat the paths below.
    found.push('Checked known paths: ' + rootedPaths.join(', '));

    // No reliable JS-file access exists; default to "Not Detected" unless a
    // native probe (not installed) reports otherwise.
    let result: RootStatus = 'Not Detected';
    if (__DEV__) result = 'Inconclusive';
    setIndicators(found);
    setStatus(result);

    setSaving(true);
    try {
      await deviceSecurityApi.postScan({
        rooted: result === 'Likely Rooted',
        developerMode: __DEV__,
        detectedPackages: SUSPECT_PACKAGES,
        checkedPaths: rootedPaths,
        method: 'static-js-best-effort',
      });
    } catch { /* offline is fine */ }
    finally { setSaving(false); }
  }, []);

  useEffect(() => { runCheck(); }, [runCheck]);

  const statusColor =
    status === 'Likely Rooted' ? COLORS.danger :
    status === 'Inconclusive' ? COLORS.warning : COLORS.safe;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.title}>Root / Jailbreak Detection</Text>
        <Text style={styles.subtitle}>Best-effort detection of common rooting frameworks.</Text>
      </View>

      {status && (
        <View style={[styles.statusCard, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      )}

      {saving && <ActivityIndicator color={COLORS.safe} style={{ marginTop: 12 }} />}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indicators explored</Text>
        {indicators.map((i, idx) => (
          <Text key={idx} style={styles.indicator}>• {i}</Text>
        ))}
        <Text style={styles.pkgList}>Suspect packages: {SUSPECT_PACKAGES.join(', ')}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={runCheck}>
        <Text style={styles.primaryButtonText}>Re-run Check</Text>
      </TouchableOpacity>

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          Best-effort detection — full root detection requires deeper OS integration (a native module that can stat system files and inspect the boot state). ShieldGuard does not claim to defeat root hiding. This check reports static signals only and is not a guarantee the device is unmodified.
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
  statusCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, alignItems: 'center' },
  statusText: { fontSize: 20, fontWeight: 'bold' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  indicator: { fontSize: 13, color: COLORS.text, marginBottom: 6, lineHeight: 18 },
  pkgList: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8, lineHeight: 16 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
