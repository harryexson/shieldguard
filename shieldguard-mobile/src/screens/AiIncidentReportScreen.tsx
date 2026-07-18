import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { aiApi, incidentsApi, Incident } from '../services/api';

function riskColor(level: string): string {
  switch (level) {
    case 'low': return COLORS.safe;
    case 'medium': return COLORS.warning;
    default: return COLORS.danger;
  }
}

export function AiIncidentReportScreen() {
  const [report, setReport] = useState<{ report: string; riskLevel: string; generatedAt: number; provider: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const incidents: Incident[] = await incidentsApi.list();
      setCount(incidents.length);
      const events = incidents.map((i) => ({
        type: i.type,
        createdAt: i.createdAt,
        location: i.location ?? null,
        battery: i.battery ?? null,
        note: i.note ?? null,
      }));
      const res = await aiApi.summarizeIncident(events);
      setReport(res);
    } catch (e: any) {
      Alert.alert('Report failed', e?.message || 'Could not summarize incidents.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { generate(); }, [generate]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📝</Text>
        <Text style={styles.title}>AI Incident Report</Text>
        <Text style={styles.subtitle}>A plain-language summary of your recent security events.</Text>
      </View>

      {count !== null && (
        <Text style={styles.countText}>{count} incident(s) on record.</Text>
      )}

      <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={generate}>
        <Text style={styles.primaryButtonText}>{loading ? 'Summarizing…' : 'Regenerate Report'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={COLORS.safe} style={{ marginTop: 16 }} />}

      {report && (
        <View style={[styles.reportCard, { borderColor: riskColor(report.riskLevel) }]}>
          <View style={styles.providerRow}>
            <Text style={[styles.riskBadge, { color: riskColor(report.riskLevel) }]}>Risk: {report.riskLevel.toUpperCase()}</Text>
            <Text style={styles.providerTag}>{report.provider === 'llm' ? 'AI' : 'Rule-based'}</Text>
          </View>
          <Text style={styles.reportBody}>{report.report}</Text>
          <Text style={styles.generated}>Generated {new Date(report.generatedAt).toLocaleString()}</Text>
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          This is a generated summary from events already stored on your device/account. It is not sent to any third party beyond the AI proxy, and no persistent PII is retained. Treat it as guidance, not a forensic record.
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
  countText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  reportCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginTop: 16, borderWidth: 2 },
  providerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  riskBadge: { fontSize: 14, fontWeight: 'bold' },
  providerTag: { fontSize: 11, color: COLORS.textSecondary, backgroundColor: COLORS.primary, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  reportBody: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  generated: { fontSize: 11, color: COLORS.textSecondary, marginTop: 12 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
