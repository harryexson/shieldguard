import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, THREAT_LEVELS } from '../constants';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function StatusCard({ title, value, subtitle, icon, color = COLORS.safe, onPress, style }: StatusCardProps) {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      style={[styles.card, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Container>
  );
}

interface ThreatLevelProps {
  level: 'safe' | 'warning' | 'danger' | 'critical';
  label?: string;
  showLabel?: boolean;
}

export function ThreatBadge({ level, label, showLabel = true }: ThreatLevelProps) {
  const color = THREAT_LEVELS[level];
  
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      {showLabel && <Text style={[styles.badgeText, { color }]}>{label || level.toUpperCase()}</Text>}
    </View>
  );
}

interface ScanButtonProps {
  onPress: () => void;
  scanning: boolean;
  progress?: number;
}

export function ScanButton({ onPress, scanning, progress }: ScanButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.scanButton, scanning && styles.scanButtonActive]}
      onPress={onPress}
      disabled={scanning}
      activeOpacity={0.8}
    >
      <Text style={styles.scanButtonIcon}>{scanning ? '⏳' : '🛡️'}</Text>
      <Text style={styles.scanButtonText}>
        {scanning ? (progress ? `${progress}%` : 'Scanning...') : 'Start Full Scan'}
      </Text>
    </TouchableOpacity>
  );
}

interface SecurityScoreProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

export function SecurityScore({ score, size = 'medium' }: SecurityScoreProps) {
  const getColor = () => {
    if (score >= 80) return COLORS.safe;
    if (score >= 60) return COLORS.warning;
    return COLORS.danger;
  };

  const sizes = {
    small: { container: 60, text: 18, label: 10 },
    medium: { container: 100, text: 28, label: 12 },
    large: { container: 140, text: 40, label: 14 },
  };

  const s = sizes[size];

  return (
    <View style={[styles.scoreContainer, { width: s.container, height: s.container, borderColor: getColor() }]}>
      <Text style={[styles.scoreText, { fontSize: s.text, color: getColor() }]}>{score}</Text>
      <Text style={[styles.scoreLabel, { fontSize: s.label }]}>Security Score</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: COLORS.safe,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonActive: {
    backgroundColor: COLORS.warning,
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scoreContainer: {
    borderRadius: 100,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  scoreText: {
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});