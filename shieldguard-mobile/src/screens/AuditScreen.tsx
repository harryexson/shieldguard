import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSecurityAudit, useAppScanner } from '../hooks/useSecurity';
import { useSecurity } from '../context/SecurityContext';
import { COLORS, THREAT_LEVELS } from '../constants';
import { SecurityCheck } from '../types';
import { StatusCard, SecurityScore } from '../components/StatusCard';

export function AuditScreen() {
  const { performAudit } = useSecurityAudit();
  const { state } = useSecurity();
  const { performScan } = useAppScanner();

  const handleAudit = async () => {
    await performAudit();
    await performScan();
  };

  const checks = state.securityAudit?.checks || [];
  const score = state.securityAudit?.score || 0;

  const renderCheckItem = (check: SecurityCheck) => (
    <View style={[styles.checkItem, !check.passed && styles.checkItemFailed]}>
      <View style={styles.checkHeader}>
        <Text style={styles.checkIcon}>{check.passed ? '✅' : '❌'}</Text>
        <Text style={[styles.checkName, !check.passed && styles.checkNameFailed]}>
          {check.name}
        </Text>
      </View>
      <Text style={styles.checkDetails}>{check.details}</Text>
      {check.recommendation && (
        <View style={styles.recommendationContainer}>
          <Text style={styles.recommendationLabel}>Recommendation:</Text>
          <Text style={styles.recommendationText}>{check.recommendation}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Security Audit</Text>
        <Text style={styles.subtitle}>Comprehensive device vulnerability assessment</Text>
      </View>

      <View style={styles.scoreSection}>
        <SecurityScore score={score} size="large" />
        <Text style={styles.scoreDescription}>
          {score >= 80 ? 'Your device is well protected' : 
           score >= 60 ? 'Your device has some security issues' : 
           'Your device needs attention'}
        </Text>
      </View>

      <TouchableOpacity style={styles.runAuditButton} onPress={handleAudit}>
        <Text style={styles.runAuditIcon}>🔍</Text>
        <Text style={styles.runAuditText}>Run Full Security Audit</Text>
      </TouchableOpacity>

      {checks.length > 0 && (
        <View style={styles.checksSection}>
          <Text style={styles.sectionTitle}>Security Checks</Text>
          {checks.map((check, index) => (
            <View key={index}>{renderCheckItem(check)}</View>
          ))}
        </View>
      )}

      {checks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>
            Run a security audit to identify vulnerabilities
          </Text>
        </View>
      )}
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
    marginBottom: 16,
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
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  runAuditButton: {
    backgroundColor: COLORS.safe,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  runAuditIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  runAuditText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  checksSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  checkItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.safe,
  },
  checkItemFailed: {
    borderColor: COLORS.danger,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  checkName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  checkNameFailed: {
    color: COLORS.danger,
  },
  checkDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingLeft: 26,
  },
  recommendationContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.warning + '15',
    borderRadius: 8,
  },
  recommendationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: COLORS.text,
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