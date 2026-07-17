import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAppScanner } from '../hooks/useSecurity';
import { useSecurity } from '../context/SecurityContext';
import { COLORS, THREAT_LEVELS } from '../constants';
import { AppInfo } from '../types';
import { StatusCard, ThreatBadge, ScanButton } from '../components/StatusCard';

export function ScannerScreen() {
  const { performScan, isScanning, progress, lastScan } = useAppScanner();
  const { state } = useSecurity();

  const handleScan = async () => {
    await performScan();
  };

  const scannedApps = lastScan?.apps || [];

  const renderAppItem = ({ item }: { item: AppInfo }) => (
    <TouchableOpacity style={styles.appItem}>
      <View style={styles.appIconContainer}>
        <Text style={styles.appIcon}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.name}</Text>
        <Text style={styles.appPackage}>{item.packageName}</Text>
        <View style={styles.appMeta}>
          <Text style={styles.appVersion}>v{item.version}</Text>
          {!item.isFromStore && (
            <ThreatBadge level="warning" label="Sideloaded" />
          )}
        </View>
      </View>
      <ThreatBadge level={item.threatLevel} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>App Scanner</Text>
        <Text style={styles.subtitle}>Scan installed apps for threats</Text>
      </View>

      <View style={styles.scanSection}>
        <ScanButton onPress={handleScan} scanning={isScanning} progress={progress} />
      </View>

      {lastScan && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Scan Results ({scannedApps.length} apps)
          </Text>
          <View style={styles.badgesRow}>
            <View style={styles.badgeItem}>
              <Text style={[styles.badgeCount, { color: COLORS.safe }]}>
                {state.stats.safeApps}
              </Text>
              <Text style={styles.badgeLabel}>Safe</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={[styles.badgeCount, { color: COLORS.warning }]}>
                {state.stats.warningApps}
              </Text>
              <Text style={styles.badgeLabel}>Warning</Text>
            </View>
            <View style={styles.badgeItem}>
              <Text style={[styles.badgeCount, { color: COLORS.danger }]}>
                {state.stats.dangerousApps}
              </Text>
              <Text style={styles.badgeLabel}>Threats</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={scannedApps}
        keyExtractor={(item) => item.packageName}
        renderItem={renderAppItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              Tap "Start Full Scan" to scan your apps
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  scanSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  badgeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  appItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  appPackage: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  appMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  appVersion: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});