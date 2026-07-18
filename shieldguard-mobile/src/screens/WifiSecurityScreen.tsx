import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { deviceSecurityApi } from '../services/api';

interface WifiState {
  connected: boolean | null;
  ssid: string | null;
  securityType: string | null;
  ip: string | null;
}

function loadNetwork(): WifiState {
  try {
    const Network = require('expo-network');
    return { connected: null, ssid: null, securityType: null, ip: null, __mod: Network } as any;
  } catch {
    return { connected: null, ssid: null, securityType: null, ip: null } as any;
  }
}

export function WifiSecurityScreen() {
  const [state, setState] = useState<WifiState>({ connected: null, ssid: null, securityType: null, ip: null });
  const [hasModule, setHasModule] = useState(true);
  const [checking, setChecking] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const scan = useCallback(async () => {
    setChecking(true);
    setWarning(null);
    try {
      const mod: any = loadNetwork();
      if (!mod.__mod) {
        setHasModule(false);
        return;
      }
      const Network = mod.__mod;
      const netState = await Network.getNetworkStateAsync();
      let ip: string | null = null;
      try { ip = await Network.getIpAddressAsync(); } catch { ip = null; }
      const ssid = netState.type === 'wifi' ? (netState.extra?.ssid ?? null) : null;
      // Expo cannot read Wi-Fi security type (no public API). Honest unknown.
      const securityType: string | null = null;
      const connected = !!netState.isConnected;
      const next: WifiState = { connected, ssid, securityType, ip };
      setState(next);

      let w: string | null = null;
      if (!connected) w = 'No active network connection detected.';
      else if (ssid === null) w = 'Connected, but Expo cannot read the network name or its security type on this platform. Verify the network is WPA2/WPA3 in your OS Wi-Fi settings.';
      else w = 'Connected to "' + ssid + '". ShieldGuard cannot read the security type (open/WEP/WPA) from Expo — confirm it is not an open network in your OS settings. Avoid transmitting sensitive data on public Wi-Fi; use a VPN.';
      setWarning(w);

      setSaving(true);
      try {
        await deviceSecurityApi.postScan({
          networkConnected: connected,
          ssid: ssid ?? undefined,
          securityType: securityType ?? 'unknown',
          ip: ip ?? undefined,
          method: 'expo-network',
        });
      } catch { /* offline ok */ }
      finally { setSaving(false); }
    } catch (e: any) {
      setHasModule(false);
    } finally { setChecking(false); }
  }, []);

  useEffect(() => { scan(); }, [scan]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🌐</Text>
        <Text style={styles.title}>Wi-Fi Security Scanner</Text>
        <Text style={styles.subtitle}>Check the network you are connected to for common risks.</Text>
      </View>

      {!hasModule && (
        <View style={styles.missingCard}>
          <Text style={styles.missingText}>This feature needs the expo-network module. Run "npx expo install expo-network" to enable it.</Text>
        </View>
      )}

      {checking && <ActivityIndicator color={COLORS.safe} style={{ marginVertical: 12 }} />}

      <View style={styles.infoCard}>
        <Row label="Connected" value={state.connected === null ? 'Unknown' : state.connected ? 'Yes' : 'No'} />
        <Row label="Network name" value={state.ssid ?? 'Unavailable'} />
        <Row label="Security type" value={state.securityType ?? 'Unknown (not readable on Expo)'} />
        <Row label="IP address" value={state.ip ?? 'Unavailable'} />
      </View>

      {warning && (
        <View style={[styles.warnCard, { borderColor: COLORS.warning }]}>
          <Text style={styles.warnText}>{warning}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} disabled={checking} onPress={scan}>
        <Text style={styles.primaryButtonText}>{checking ? 'Scanning…' : 'Re-scan Network'}</Text>
      </TouchableOpacity>

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          Expo does not expose Wi-Fi security type (open/WEP/WPA3) or captive-portal/MITM detection to JavaScript. ShieldGuard reports connection state and SSID where available and gives honest guidance — it cannot certify a network is safe.
        </Text>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  missingCard: { backgroundColor: COLORS.danger + '18', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.danger + '50' },
  missingText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  infoCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary },
  rowValue: { fontSize: 13, color: COLORS.text, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  warnCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  warnText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
