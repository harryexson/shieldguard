import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNetworkMonitor } from '../hooks/useSecurity';
import { COLORS, THREAT_LEVELS } from '../constants';
import { NetworkConnection } from '../types';
import { ThreatBadge, StatusCard } from '../components/StatusCard';

export function NetworkScreen() {
  const { connections, suspiciousConnections, totalBandwidth } = useNetworkMonitor();

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderConnectionItem = ({ item }: { item: NetworkConnection }) => (
    <TouchableOpacity style={styles.connectionItem}>
      <View style={styles.connectionIconContainer}>
        <Text style={styles.connectionIcon}>
          {item.protocol === 'HTTPS' ? '🔒' : item.protocol === 'HTTP' ? '🌐' : '📡'}
        </Text>
      </View>
      <View style={styles.connectionInfo}>
        <View style={styles.connectionHeader}>
          <Text style={styles.appName}>{item.appName}</Text>
          <ThreatBadge level={item.reputation === 'safe' ? 'safe' : item.reputation === 'suspicious' ? 'warning' : 'danger'} />
        </View>
        <Text style={styles.domain}>{item.domain}</Text>
        <View style={styles.connectionDetails}>
          <Text style={styles.detailText}>IP: {item.ip}</Text>
          <Text style={styles.detailText}>Port: {item.port}</Text>
          <Text style={styles.detailText}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
      <View style={styles.bandwidthContainer}>
        <Text style={styles.bandwidthLabel}>↓ {formatBytes(item.bytesIn)}</Text>
        <Text style={styles.bandwidthLabel}>↑ {formatBytes(item.bytesOut)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Monitor</Text>
        <Text style={styles.subtitle}>Monitor network traffic for suspicious activity</Text>
      </View>

      <View style={styles.statsRow}>
        <StatusCard
          title="Total Connections"
          value={connections.length}
          icon="📡"
          color={COLORS.text}
          style={styles.statCard}
        />
        <StatusCard
          title="Suspicious"
          value={suspiciousConnections.length}
          icon="⚠️"
          color={COLORS.warning}
          style={styles.statCard}
        />
      </View>

      <View style={styles.statsRow}>
        <StatusCard
          title="Total Data"
          value={formatBytes(totalBandwidth)}
          icon="📊"
          color={COLORS.safe}
          style={styles.statCard}
        />
        <StatusCard
          title="Safe %"
          value={`${Math.round((connections.length - suspiciousConnections.length) / connections.length * 100)}%`}
          icon="✅"
          color={COLORS.safe}
          style={styles.statCard}
        />
      </View>

      {suspiciousConnections.length > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Suspicious Activity Detected</Text>
            <Text style={styles.warningText}>
              {suspiciousConnections.length} connection(s) to suspicious domains/IPS
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Active Connections</Text>

      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        renderItem={renderConnectionItem}
        contentContainerStyle={styles.list}
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  warningBanner: {
    backgroundColor: COLORS.warning + '20',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  warningText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 16,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  connectionItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionIcon: {
    fontSize: 20,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  domain: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  connectionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginRight: 12,
  },
  bandwidthContainer: {
    alignItems: 'flex-end',
  },
  bandwidthLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});