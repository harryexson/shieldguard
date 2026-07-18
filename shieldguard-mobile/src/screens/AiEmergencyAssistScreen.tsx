import React, { useCallback, useState } from 'react';
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
import { aiApi, AiEmergencyAssist } from '../services/api';

export function AiEmergencyAssistScreen() {
  const [location, setLocation] = useState('');
  const [contacts, setContacts] = useState('');
  const [result, setResult] = useState<AiEmergencyAssist | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const context = {
        location: location.trim() || 'unknown',
        contacts: contacts.trim()
          ? contacts.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
        battery: -1,
      };
      const res = await aiApi.emergencyAssist(context);
      setResult(res);
    } catch (e: any) {
      Alert.alert('Emergency Assistant', e?.message || 'Could not prepare assistance steps.');
    } finally {
      setLoading(false);
    }
  }, [location, contacts]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🚨</Text>
        <Text style={styles.title}>AI Emergency Assistant</Text>
        <Text style={styles.subtitle}>Get ordered steps to stay safe right now.</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Your location (optional)"
        placeholderTextColor={COLORS.textSecondary}
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="Emergency contacts (comma-separated)"
        placeholderTextColor={COLORS.textSecondary}
        value={contacts}
        onChangeText={setContacts}
      />

      <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={run}>
        <Text style={styles.primaryButtonText}>{loading ? 'Preparing…' : 'Prepare assistance'}</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.card}>
          {result.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
          {result.contactsNote ? (
            <View style={styles.note}>
              <Text style={styles.noteText}>{result.contactsNote}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          This provides guidance only. In a life-threatening emergency, call your local emergency number directly. ShieldGuard does not contact responders on your behalf.
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
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, fontSize: 14, marginBottom: 12 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.safe },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.safe, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepNumText: { color: '#04121E', fontWeight: 'bold', fontSize: 13 },
  stepText: { flex: 1, color: COLORS.text, fontSize: 14, lineHeight: 20 },
  note: { backgroundColor: COLORS.accent + '20', borderRadius: 10, padding: 12, marginTop: 4 },
  noteText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  honest: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  honestText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
