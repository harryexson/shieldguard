import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../constants';
import { aiApi, AiThreatExplain } from '../services/api';

export function AiThreatExplainScreen() {
  const [warning, setWarning] = useState('');
  const [result, setResult] = useState<AiThreatExplain | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    if (!warning.trim()) {
      Alert.alert('Explain', 'Paste the warning text you want explained.');
      return;
    }
    setLoading(true);
    try {
      const res = await aiApi.threatExplain(warning.trim());
      setResult(res);
    } catch (e: any) {
      Alert.alert('Threat Explain', e?.message || 'Could not explain this warning.');
    } finally {
      setLoading(false);
    }
  };

  const sevColor =
    result?.severity === 'critical' || result?.severity === 'high'
      ? COLORS.danger
      : result?.severity === 'medium'
      ? COLORS.warning
      : COLORS.safe;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🧠</Text>
        <Text style={styles.title}>AI Threat Explanations</Text>
        <Text style={styles.subtitle}>Turn a cryptic warning into plain guidance.</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Paste a warning message…"
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={warning}
        onChangeText={setWarning}
      />

      <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={explain}>
        <Text style={styles.primaryButtonText}>{loading ? 'Explaining…' : 'Explain'}</Text>
      </TouchableOpacity>

      {result && (
        <View style={[styles.card, { borderColor: sevColor }]}>
          <Text style={styles.sevLabel}>Severity</Text>
          <Text style={[styles.sevValue, { color: sevColor }]}>{result.severity.toUpperCase()}</Text>
          <Text style={styles.explanation}>{result.explanation}</Text>
          <Text style={styles.actionsTitle}>Recommended actions</Text>
          {result.recommendedActions.map((a, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          Explanations are AI-generated guidance only. They are not a substitute for professional security advice.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 40, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, fontSize: 14, minHeight: 96, marginBottom: 12 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1 },
  sevLabel: { fontSize: 12, color: COLORS.textSecondary },
  sevValue: { fontSize: 18, fontWeight: 'bold', marginTop: 2, marginBottom: 12 },
  explanation: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 12 },
  actionsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  tipRow: { flexDirection: 'row', marginBottom: 8 },
  tipBullet: { color: COLORS.safe, marginRight: 8, fontSize: 14 },
  tipText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 20 },
  honest: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  honestText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
