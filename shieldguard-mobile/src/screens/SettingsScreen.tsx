import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSecurity, useSettings } from '../context/SecurityContext';
import { useSubscription } from '../context/SubscriptionContext';
import { FeatureGate } from '../components/FeatureGate';
import { api } from '../services/api';
import { COLORS } from '../constants';

const TIER_LABEL: Record<string, string> = { free: 'Free', standard: 'Standard', premium: 'Premium' };

export function SettingsScreen() {
  const { dispatch } = useSecurity();
  const settings = useSettings();
  const { tier, entitlements } = useSubscription();
  const navigation = useNavigation<any>();

  const toggleSetting = (key: string, value: boolean) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  };

  const renderSettingItem = (title: string, subtitle: string, value: boolean, settingKey: string) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => toggleSetting(settingKey, val)}
        trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }}
        thumbColor={value ? COLORS.safe : COLORS.textSecondary}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure your protection</Text>
      </View>

      <TouchableOpacity style={styles.planCard} onPress={() => navigation.navigate('Subscription')}>
        <View style={styles.planInfo}>
          <Text style={styles.planLabel}>Your plan</Text>
          <Text style={styles.planName}>{TIER_LABEL[tier]}</Text>
        </View>
        <Text style={styles.planChevron}>Manage ›</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Protection Features</Text>
        {renderSettingItem('Real-time Protection', 'Monitor apps and network in background', settings.realTimeMonitoring, 'realTimeMonitoring')}
        {renderSettingItem('Threat Alerts', 'Get notified about threats', settings.threatAlertsEnabled, 'threatAlertsEnabled')}
        {renderSettingItem('Push Notifications', 'Receive security alerts', settings.notificationsEnabled, 'notificationsEnabled')}
        <FeatureGate feature="network_monitor">
          {renderSettingItem('Network Monitoring', 'Track network connections', settings.networkMonitoringEnabled, 'networkMonitoringEnabled')}
        </FeatureGate>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Automatic Scanning</Text>
        {renderSettingItem('Auto Scan', 'Scan apps automatically', settings.autoScanEnabled, 'autoScanEnabled')}
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Scanner')}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Run a manual scan</Text>
            <Text style={styles.settingSubtitle}>Check installed apps now</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ What ShieldGuard does</Text>
        <Text style={styles.bullet}>• Scans installed apps against known spyware & surveillance signatures</Text>
        <Text style={styles.bullet}>• Checks domains/IPs against a threat blocklist</Text>
        <Text style={styles.bullet}>• Reviews app permissions for dangerous combinations</Text>
        <Text style={styles.bullet}>• Heuristic analysis of SMS & email for phishing</Text>
        <Text style={styles.bullet}>• Inspects app network connections</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Honest limitations</Text>
        <View style={styles.limitCard}>
          <Text style={styles.limitText}>
            A third-party app on stock Android/iOS cannot spoof your MAC address, fake your GPS,
            block screenshots system-wide, intercept the cellular baseband (IMSI catchers), or block
            OS-level facial recognition. Those require device/OS-level access. ShieldGuard delivers the
            protections that are genuinely possible and is honest about the rest.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Stay safe. Stay protected. Stay anonymous.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  planCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.safe + '50',
  },
  planInfo: { flex: 1 },
  planLabel: { fontSize: 12, color: COLORS.textSecondary },
  planName: { fontSize: 20, fontWeight: 'bold', color: COLORS.safe, marginTop: 2 },
  planChevron: { fontSize: 14, color: COLORS.safe, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  settingItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  settingInfo: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  settingSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: COLORS.textSecondary },
  bullet: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, lineHeight: 18 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
});
