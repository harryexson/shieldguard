import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { StatusCard, SecurityScore, ScanButton } from '../components/StatusCard';
import { useAppScanner, useNetworkMonitor, useSecurityAudit, useDeviceInfo } from '../hooks/useSecurity';
import { useSecurity } from '../context/SecurityContext';
import { COLORS } from '../constants';

export function DashboardScreen({ navigation }: any) {
  const { performScan } = useAppScanner();
  const { connections, suspiciousConnections } = useNetworkMonitor();
  const { performAudit } = useSecurityAudit();
  const { getDeviceInfo } = useDeviceInfo();
  const { state, dispatch } = useSecurity();

  const handleScan = async () => {
    await performScan();
    await performAudit();
    await getDeviceInfo();
  };

  const lastScanDate = state.lastScan?.timestamp 
    ? new Date(state.lastScan.timestamp).toLocaleDateString()
    : 'Never';

  const securityScore = state.securityAudit?.score || 0;
  const threatCount = state.stats.dangerousApps || 0;

  const unreadAlerts = state.alerts.filter(a => !a.read).length;

  React.useEffect(() => {
    dispatch({ type: 'SET_ALERTS', payload: [
      {
        id: '1',
        timestamp: Date.now() - 3600000,
        title: 'Suspicious App Detected',
        message: 'System Update Pro has suspicious permissions',
        severity: 'high',
        type: 'warning',
        read: false,
      },
      {
        id: '2',
        timestamp: Date.now() - 7200000,
        title: 'Network Warning',
        message: 'Unusual connection to update-check.system detected',
        severity: 'medium',
        type: 'warning',
        read: false,
      },
      {
        id: '3',
        timestamp: Date.now() - 86400000,
        title: 'Weekly Security Reminder',
        message: 'Run a full scan to ensure your device is protected',
        severity: 'low',
        type: 'info',
        read: true,
      },
    ]});
  }, [dispatch]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.shieldIcon}>🛡️</Text>
        <Text style={styles.title}>ShieldGuard</Text>
        <Text style={styles.subtitle}>Mobile Security Protection</Text>
      </View>

      <View style={styles.scoreContainer}>
        <SecurityScore score={securityScore} size="large" />
      </View>

      <View style={styles.scanContainer}>
        <ScanButton onPress={handleScan} scanning={state.isScanning} />
      </View>

      <View style={styles.statusRow}>
        <StatusCard
          title="Total Apps"
          value={state.stats.totalApps || 11}
          icon="📱"
          color={COLORS.text}
          style={styles.statusCard}
        />
        <StatusCard
          title="Safe Apps"
          value={state.stats.safeApps || 7}
          icon="✅"
          color={COLORS.safe}
          style={styles.statusCard}
        />
      </View>

      <View style={styles.statusRow}>
        <StatusCard
          title="Warnings"
          value={state.stats.warningApps || 1}
          icon="⚠️"
          color={COLORS.warning}
          style={styles.statusCard}
        />
        <StatusCard
          title="Threats"
          value={threatCount || 3}
          icon="🔴"
          color={COLORS.danger}
          style={styles.statusCard}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Scanner')}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionLabel}>App Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Network')}
          >
            <Text style={styles.actionIcon}>🌐</Text>
            <Text style={styles.actionLabel}>Network</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Audit')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>Audit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Features</Text>
        <View style={styles.featuresGrid}>
          <TouchableOpacity style={styles.featureButton} onPress={() => navigation.navigate('SMSSecurity')}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureLabel}>SMS Security</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureButton} onPress={() => navigation.navigate('CellSignal')}>
            <Text style={styles.featureIcon}>📡</Text>
            <Text style={styles.featureLabel}>Cell Signal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureButton} onPress={() => navigation.navigate('EmailSecurity')}>
            <Text style={styles.featureIcon}>📧</Text>
            <Text style={styles.featureLabel}>Email Security</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureButton} onPress={() => navigation.navigate('DeviceExtraction')}>
            <Text style={styles.featureIcon}>🔌</Text>
            <Text style={styles.featureLabel}>Extraction Defense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureButton} onPress={() => navigation.navigate('SocialVault')}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureLabel}>Social Vault</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.alertBanner}
          onPress={() => navigation.navigate('Alerts')}
        >
          <View style={styles.alertBannerContent}>
            <Text style={styles.alertIcon}>🔔</Text>
            <View>
              <Text style={styles.alertTitle}>Security Alerts</Text>
              <Text style={styles.alertMessage}>
                {unreadAlerts > 0 ? `${unreadAlerts} unread alert(s)` : 'All caught up!'}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lastScan}>
        <Text style={styles.lastScanText}>Last scan: {lastScanDate}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scanContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  alertBanner: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  alertBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '18%',
    flex: 1,
    minWidth: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
  },
  lastScan: {
    alignItems: 'center',
    marginTop: 16,
  },
  lastScanText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});