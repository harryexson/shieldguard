import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSecurity } from '../context/SecurityContext';
import { COLORS } from '../constants';
import { Alert } from '../types';

export function AlertsScreen() {
  const { state, dispatch } = useSecurity();

  const alerts = state.alerts;

  const markAsRead = (alertId: string) => {
    dispatch({ type: 'MARK_ALERT_READ', payload: alertId });
  };

  const dismissAlert = (alertId: string) => {
    dispatch({ type: 'DISMISS_ALERT', payload: alertId });
  };

  const formatTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return COLORS.danger;
      case 'high': return COLORS.danger;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.safe;
      default: return COLORS.textSecondary;
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'threat': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const renderAlertItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity 
      style={[styles.alertItem, !item.read && styles.alertItemUnread]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.alertHeader}>
        <Text style={styles.alertIcon}>{getTypeIcon(item.type)}</Text>
        <View style={styles.alertInfo}>
          <Text style={[styles.alertTitle, !item.read && styles.alertTitleUnread]}>{item.title}</Text>
          <Text style={styles.alertTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '20' }]}>
          <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
            {item.severity.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.alertMessage}>{item.message}</Text>
      <TouchableOpacity 
        style={styles.dismissButton}
        onPress={() => dismissAlert(item.id)}
      >
        <Text style={styles.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Security Alerts</Text>
        <Text style={styles.subtitle}>
          {unreadCount > 0 ? `${unreadCount} unread alert(s)` : 'All caught up!'}
        </Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No alerts</Text>
            <Text style={styles.emptySubtext}>
              You're protected! We'll notify you of any threats.
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
  list: {
    padding: 16,
    paddingTop: 0,
  },
  alertItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertItemUnread: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning + '10',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertTitleUnread: {
    fontWeight: 'bold',
  },
  alertTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  dismissButton: {
    alignSelf: 'flex-end',
  },
  dismissText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});