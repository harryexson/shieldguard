import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useSubscription } from '../context/SubscriptionContext';
import { FeatureGate } from '../components/FeatureGate';
import { api } from '../services/api';

interface EmailResult {
  risk: 'safe' | 'suspicious' | 'dangerous';
  score: number;
  reasons: string[];
  recommendation: string;
}

function EmailScannerBody() {
  const [from, setFrom] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [result, setResult] = React.useState<EmailResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const analyze = async () => {
    if (!from.trim() && !subject.trim() && !body.trim()) {
      setError('Enter at least the sender, subject or body.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/scan/email', { from, subject, body });
      setResult(res.data);
    } catch (e: any) {
      if (e?.response?.status === 402) setError('This feature is not in your plan.');
      else setError('Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const riskColor =
    result?.risk === 'dangerous' ? COLORS.danger : result?.risk === 'suspicious' ? COLORS.warning : COLORS.safe;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Email Phishing Analysis</Text>
      <TextInput style={styles.input} placeholder="Sender (from)…" placeholderTextColor={COLORS.textSecondary} value={from} onChangeText={setFrom} autoCapitalize="none" />
      <TextInput style={[styles.input, styles.gap]} placeholder="Subject…" placeholderTextColor={COLORS.textSecondary} value={subject} onChangeText={setSubject} />
      <TextInput style={[styles.input, styles.gap]} placeholder="Body…" placeholderTextColor={COLORS.textSecondary} multiline value={body} onChangeText={setBody} />
      <TouchableOpacity style={styles.button} onPress={analyze} disabled={loading}>
        {loading ? <ActivityIndicator color="#04121E" /> : <Text style={styles.buttonText}>Analyze email</Text>}
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result && (
        <View style={[styles.resultCard, { borderColor: riskColor }]}>
          <View style={styles.resultHead}>
            <Text style={styles.resultLabel}>Risk</Text>
            <Text style={[styles.resultValue, { color: riskColor }]}>{result.risk.toUpperCase()}</Text>
          </View>
          <Text style={styles.score}>Score: {result.score}/100</Text>
          {result.reasons.length > 0 && (
            <View style={styles.reasons}>
              {result.reasons.map((r, i) => (
                <Text key={i} style={styles.reason}>• {r}</Text>
              ))}
            </View>
          )}
          <Text style={styles.recommendation}>{result.recommendation}</Text>
        </View>
      )}
    </View>
  );
}

export function EmailSecurityScreen() {
  const [phishingDetection, setPhishingDetection] = React.useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Email Security</Text>
        <Text style={styles.subtitle}>Heuristic detection of phishing, spoofing and unsafe links</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Engine</Text>
        <Text style={styles.statusValue}>Backend-connected</Text>
        <Text style={styles.statusDetail}>Analyzes sender, subject and body for threat patterns</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Live email scanning</Text>
            <Text style={styles.featureDesc}>Routes email content through the detection engine</Text>
          </View>
          <Switch value={phishingDetection} onValueChange={setPhishingDetection} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={phishingDetection ? COLORS.safe : COLORS.textSecondary} />
        </View>
      </View>

      <FeatureGate feature="email_scan">
        <EmailScannerBody />
      </FeatureGate>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  statusCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statusLabel: { fontSize: 12, color: COLORS.textSecondary },
  statusValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  statusDetail: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  featureItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  featureInfo: { flex: 1, marginRight: 12 },
  featureName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  featureDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gap: { marginTop: 8 },
  button: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#04121E', fontSize: 14, fontWeight: 'bold' },
  error: { color: COLORS.danger, fontSize: 12, marginTop: 8 },
  resultCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 14, borderWidth: 1 },
  resultHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 12, color: COLORS.textSecondary },
  resultValue: { fontSize: 16, fontWeight: 'bold' },
  score: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  reasons: { marginTop: 8 },
  reason: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  recommendation: { fontSize: 13, color: COLORS.text, marginTop: 10 },
});
