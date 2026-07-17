import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';

export function SocialVaultScreen() {
  const [vaultEnabled, setVaultEnabled] = useState(true);
  const [profileEncryption, setProfileEncryption] = useState(true);
  const [sessionEncryption, setSessionEncryption] = useState(true);

  const platforms = [
    { name: 'Facebook', connected: true, encrypted: true },
    { name: 'Instagram', connected: true, encrypted: true },
    { name: 'Twitter / X', connected: false, encrypted: false },
    { name: 'LinkedIn', connected: true, encrypted: true },
    { name: 'TikTok', connected: false, encrypted: false },
    { name: 'Telegram', connected: true, encrypted: true },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Social Media Vault</Text>
        <Text style={styles.subtitle}>End-to-end encrypted storage for social media profiles</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Vault Status</Text>
        <Text style={styles.statusValue}>Protected</Text>
        <Text style={styles.statusDetail}>4 profiles encrypted | 0 access attempts today</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vault Settings</Text>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Profile Association Encryption</Text>
            <Text style={styles.featureDesc}>Encrypts links between device and social accounts</Text>
          </View>
          <Switch value={profileEncryption} onValueChange={setProfileEncryption} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={profileEncryption ? COLORS.safe : COLORS.textSecondary} />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Session Routing</Text>
            <Text style={styles.featureDesc}>Routes social sessions through encrypted tunnels</Text>
          </View>
          <Switch value={sessionEncryption} onValueChange={setSessionEncryption} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={sessionEncryption ? COLORS.safe : COLORS.textSecondary} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Platforms</Text>
        {platforms.map((p, i) => (
          <View key={i} style={styles.platformItem}>
            <Text style={styles.platformIcon}>🔗</Text>
            <View style={styles.platformInfo}>
              <Text style={styles.platformName}>{p.name}</Text>
              <Text style={styles.platformStatus}>
                {p.connected ? (p.encrypted ? 'Encrypted' : 'Connected') : 'Not connected'}
              </Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: p.encrypted ? COLORS.safe : COLORS.textSecondary }]} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Log</Text>
        <View style={styles.logItem}>
          <Text style={styles.logIcon}>🔓</Text>
          <View>
            <Text style={styles.logTitle}>Vault accessed</Text>
            <Text style={styles.logDesc}>From ShieldGuard app • Authenticated</Text>
          </View>
          <Text style={styles.logTime}>Now</Text>
        </View>
        <View style={styles.logItem}>
          <Text style={styles.logIcon}>🚫</Text>
          <View>
            <Text style={styles.logTitle}>Blocked: Unknown app attempted access</Text>
            <Text style={styles.logDesc}>App: com.unknown.reader • Blocked</Text>
          </View>
          <Text style={styles.logTime}>1h ago</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  statusCard: { backgroundColor: COLORS.safe + '15', borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.safe + '40' },
  statusLabel: { fontSize: 12, color: COLORS.textSecondary },
  statusValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.safe, marginTop: 4 },
  statusDetail: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  featureItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  featureInfo: { flex: 1, marginRight: 12 },
  featureName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  featureDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  platformItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  platformIcon: { fontSize: 18, marginRight: 12 },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  platformStatus: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  logItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  logIcon: { fontSize: 18, marginRight: 12 },
  logTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  logDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  logTime: { fontSize: 10, color: COLORS.textSecondary, marginLeft: 'auto' },
});
