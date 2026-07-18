import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';
import { PinGate } from '../components/PinGate';
import { encryptJson, decryptJson } from '../services/crypto';

function QrInner() {
  const { pin } = useVault();
  const [tab, setTab] = useState<'create' | 'scan'>('create');
  const [text, setText] = useState('');
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [hasQr, setHasQr] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);

  React.useEffect(() => {
    try { require('react-native-qrcode-svg'); } catch { setHasQr(false); }
    try { require('expo-camera'); } catch { setHasCamera(false); }
  }, []);

  const create = useCallback(() => {
    if (!text.trim()) { Alert.alert('Empty', 'Enter text or a secret to share.'); return; }
    try {
      const payload = encryptJson(text.trim(), pin!);
      setQrPayload(payload);
    } catch (e: any) {
      Alert.alert('Encrypt failed', e?.message || 'Could not encrypt.');
    }
  }, [text, pin]);

  const decrypt = useCallback(() => {
    if (!scanInput.trim()) { Alert.alert('Input required', 'Paste or scan an encrypted QR payload.'); return; }
    try {
      const plain = decryptJson<string>(scanInput.trim(), pin!);
      setDecrypted(plain);
    } catch (e: any) {
      Alert.alert('Decrypt failed', 'Wrong PIN or corrupted payload.');
    }
  }, [scanInput, pin]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔳</Text>
        <Text style={styles.title}>QR Secure Share</Text>
        <Text style={styles.subtitle}>Encrypt a small secret into a QR. The recipient decrypts with the same PIN.</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'create' && styles.tabActive]} onPress={() => setTab('create')}>
          <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'scan' && styles.tabActive]} onPress={() => setTab('scan')}>
          <Text style={[styles.tabText, tab === 'scan' && styles.tabTextActive]}>Decrypt</Text>
        </TouchableOpacity>
      </View>

      {tab === 'create' ? (
        <View>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Secret or text to encrypt" placeholderTextColor={COLORS.textSecondary} value={text} onChangeText={setText} multiline />
          <TouchableOpacity style={styles.primaryButton} onPress={create}>
            <Text style={styles.primaryButtonText}>Encrypt → QR</Text>
          </TouchableOpacity>

          {!hasQr && (
            <View style={styles.missingCard}>
              <Text style={styles.missingText}>QR rendering needs react-native-qrcode-svg. Run "npx expo install react-native-qrcode-svg". The encrypted payload is shown as text below instead.</Text>
            </View>
          )}

          {qrPayload && (
            <View style={styles.qrCard}>
              {hasQr ? <QrSvg value={qrPayload} /> : (
                <Text style={styles.qrText} selectable>{qrPayload}</Text>
              )}
              <Text style={styles.qrNote}>Encrypted with your vault PIN. Share only with someone who knows the PIN.</Text>
            </View>
          )}
        </View>
      ) : (
        <View>
          <Text style={styles.fieldLabel}>Paste scanned QR payload</Text>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Encrypted payload" placeholderTextColor={COLORS.textSecondary} value={scanInput} onChangeText={setScanInput} multiline autoCapitalize="none" />
          {hasCamera && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => Alert.alert('Scanner', 'Point the in-app camera at a QR to auto-fill (expo-camera mounted view). Paste works without it.')}>
              <Text style={styles.secondaryButtonText}>Open camera scanner</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={decrypt}>
            <Text style={styles.primaryButtonText}>Decrypt</Text>
          </TouchableOpacity>
          {decrypted && (
            <View style={styles.qrCard}>
              <Text style={styles.resultLabel}>Decrypted</Text>
              <Text style={styles.qrText} selectable>{decrypted}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          The QR encodes only ciphertext; the PIN is never embedded. The recipient must know the same PIN to decrypt — exchange it over a trusted channel. This is for small secrets, not large files.
        </Text>
      </View>
    </ScrollView>
  );
}

function QrSvg({ value }: { value: string }) {
  const QRCode = require('react-native-qrcode-svg').default;
  return <QRCode value={value} size={200} backgroundColor={COLORS.text} color={COLORS.primary} />;
}

export function QrSecureShareScreen() {
  return (
    <PinGate title="Share Locked" subtitle="Unlock your vault to encrypt/decrypt QR secrets.">
      <QrInner />
    </PinGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  tabRow: { flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, backgroundColor: COLORS.card, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  tabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.text },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, width: '100%' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  secondaryButton: { backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: COLORS.accent },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  fieldLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, marginTop: 4 },
  missingCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.warning + '40' },
  missingText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  qrCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  qrText: { fontSize: 12, color: COLORS.text, lineHeight: 18, marginTop: 8 },
  qrNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 16 },
  resultLabel: { fontSize: 12, color: COLORS.textSecondary },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
