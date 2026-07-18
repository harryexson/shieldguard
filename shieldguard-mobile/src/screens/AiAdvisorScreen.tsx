import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { aiApi, deviceSecurityApi, DevicePosture } from '../services/api';

function riskColor(level: string): string {
  switch (level) {
    case 'low': return COLORS.safe;
    case 'medium': return COLORS.warning;
    default: return COLORS.danger;
  }
}

export function AiAdvisorScreen() {
  const [deviceNotes, setDeviceNotes] = useState('');
  const [advice, setAdvice] = useState<{ provider: string; riskLevel: string; summary: string; recommendations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = useCallback(async () => {
    setLoading(true);
    try {
      const scan = await deviceSecurityApi.getScan().catch(() => null);
      const signals = {
        device: scan ? (scan.posture ?? scan) : null,
        notes: deviceNotes,
        askedAt: Date.now(),
      };
      const res = await aiApi.advise(signals);
      setAdvice(res);
    } catch (e: any) {
      Alert.alert('Advisor unavailable', e?.message || 'Could not reach the AI advisor.');
    } finally { setLoading(false); }
  }, [deviceNotes]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🤖</Text>
        <Text style={styles.title}>AI Security Advisor</Text>
        <Text style={styles.subtitle}>Get a plain-language read on how secure your phone is right now.</Text>
      </View>

      <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} placeholder="Add context (e.g. 'I use a VPN', 'no screen lock') — optional" placeholderTextColor={COLORS.textSecondary} value={deviceNotes} onChangeText={setDeviceNotes} multiline />

      <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={ask}>
        <Text style={styles.primaryButtonText}>{loading ? 'Analyzing…' : 'Ask the Advisor'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={COLORS.safe} style={{ marginTop: 16 }} />}

      {advice && (
        <View style={[styles.adviceCard, { borderColor: riskColor(advice.riskLevel) }]}>
          <View style={styles.providerRow}>
            <Text style={[styles.riskBadge, { color: riskColor(advice.riskLevel) }]}>Risk: {advice.riskLevel.toUpperCase()}</Text>
            <Text style={styles.providerTag}>{advice.provider === 'llm' ? 'AI' : 'Rule-based'}</Text>
          </View>
          <Text style={styles.summary}>{advice.summary}</Text>
          <Text style={styles.recTitle}>Recommendations</Text>
          {advice.recommendations.length === 0 && <Text style={styles.recItem}>No specific issues flagged.</Text>}
          {advice.recommendations.map((r, i) => (
            <Text key={i} style={styles.recItem}>• {r}</Text>
          ))}
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          The advisor only sees signals you consent to and aggregates on-device/backend. If it runs in "rule-based" mode, no LLM was used (offline). It offers guidance only — it never silently changes your settings.
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
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, width: '100%' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  adviceCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginTop: 16, borderWidth: 2 },
  providerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  riskBadge: { fontSize: 14, fontWeight: 'bold' },
  providerTag: { fontSize: 11, color: COLORS.textSecondary, backgroundColor: COLORS.primary, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  summary: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  recTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 14 },
  recItem: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
