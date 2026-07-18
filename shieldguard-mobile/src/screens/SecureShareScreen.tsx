import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';
import { PinGate } from '../components/PinGate';
import { encryptJson } from '../services/crypto';
import { shareApi, ShareMeta } from '../services/api';
import { API_BASE_URL } from '../constants';

function ShareInner() {
  const { pin } = useVault();
  const [tab, setTab] = useState<'send' | 'receive'>('send');
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [maxViews, setMaxViews] = useState<number>(1);
  const [ttl, setTtl] = useState<number>(3600);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ShareMeta | null>(null);
  const [token, setToken] = useState('');
  const [received, setReceived] = useState<string | null>(null);

  const ttlOptions = [
    { label: '1 hour', value: 3600 },
    { label: '24 hours', value: 86400 },
    { label: '7 days', value: 604800 },
  ];
  const viewOptions = [1, 3, 5];

  const send = async () => {
    if (!content.trim()) { Alert.alert('Empty', 'Enter content to share.'); return; }
    setBusy(true);
    try {
      const payload = encryptJson({ content: content.trim(), name: name.trim() }, pin!);
      const meta = await shareApi.create({ payload, name: name.trim() || undefined, maxViews, ttlSeconds: ttl });
      setResult(meta);
    } catch (e: any) { Alert.alert('Share failed', e?.message || 'Could not create share.'); }
    finally { setBusy(false); }
  };

  const receive = async () => {
    if (!token.trim()) { Alert.alert('Token required', 'Paste the share token.'); return; }
    setBusy(true);
    try {
      const data = await shareApi.fetch(token.trim());
      try {
        const c = JSON.parse(data.payload);
        setReceived(c.content || data.payload);
      } catch { setReceived(data.payload); }
    } catch (e: any) { Alert.alert('Fetch failed', e?.message || 'Invalid or expired token.'); }
    finally { setBusy(false); }
  };

  const copy = (text: string) => {
    try { const { Clipboard } = require('react-native'); Clipboard.setString(text); Alert.alert('Copied', 'Copied to clipboard.'); }
    catch { Alert.alert('Copy unavailable', 'Clipboard not available.'); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔗</Text>
        <Text style={styles.title}>Secure Share</Text>
        <Text style={styles.subtitle}>Content is encrypted on this device before sharing. Recipients need the token and the PIN to decrypt.</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'send' && styles.tabActive]} onPress={() => setTab('send')}>
          <Text style={[styles.tabText, tab === 'send' && styles.tabTextActive]}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'receive' && styles.tabActive]} onPress={() => setTab('receive')}>
          <Text style={[styles.tabText, tab === 'receive' && styles.tabTextActive]}>Receive</Text>
        </TouchableOpacity>
      </View>

      {tab === 'send' ? (
        <View>
          <TextInput style={styles.input} placeholder="Name (optional)" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
          <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} placeholder="Content to share (encrypted before send)" placeholderTextColor={COLORS.textSecondary} value={content} onChangeText={setContent} multiline />

          <Text style={styles.fieldLabel}>Max views</Text>
          <View style={styles.chipRow}>
            {viewOptions.map((v) => (
              <TouchableOpacity key={v} style={[styles.chip, v === maxViews && styles.chipActive]} onPress={() => setMaxViews(v)}>
                <Text style={[styles.chipText, v === maxViews && styles.chipTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Link lifetime</Text>
          <View style={styles.chipRow}>
            {ttlOptions.map((o) => (
              <TouchableOpacity key={o.value} style={[styles.chip, o.value === ttl && styles.chipActive]} onPress={() => setTtl(o.value)}>
                <Text style={[styles.chipText, o.value === ttl && styles.chipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={send}>
            <Text style={styles.primaryButtonText}>{busy ? 'Encrypting…' : 'Create Secure Link'}</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Share token</Text>
              <Text style={styles.resultValue} selectable>{result.token}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={() => copy(`${API_BASE_URL.replace('/api', '')}/share/${result.token}`)}>
                <Text style={styles.copyText}>Copy link</Text>
              </TouchableOpacity>
              <Text style={styles.resultNote}>Link expires after {result.maxViews ?? maxViews} views or the chosen lifetime. Decryption requires the PIN you used.</Text>
            </View>
          )}
        </View>
      ) : (
        <View>
          <TextInput style={styles.input} placeholder="Paste share token" placeholderTextColor={COLORS.textSecondary} value={token} onChangeText={setToken} autoCapitalize="none" />
          <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={receive}>
            <Text style={styles.primaryButtonText}>{busy ? 'Fetching…' : 'Fetch & Decrypt'}</Text>
          </TouchableOpacity>
          {received && (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Decrypted content</Text>
              <Text style={styles.resultValue} selectable>{received}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          Sharing is zero-knowledge: the server stores only ciphertext. However, the recipient still needs the PIN to decrypt — there is no way to securely transmit the PIN through this link. Exchange the PIN over a trusted channel.
        </Text>
      </View>
    </ScrollView>
  );
}

export function SecureShareScreen() {
  return <PinGate title="Share Locked" subtitle="Enter your PIN to encrypt and share content."><ShareInner /></PinGate>;
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
  fieldLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, marginTop: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 8 },
  chip: { backgroundColor: COLORS.card, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.safe, borderColor: COLORS.safe },
  chipText: { fontSize: 14, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  resultCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  resultLabel: { fontSize: 12, color: COLORS.textSecondary },
  resultValue: { fontSize: 14, color: COLORS.text, marginTop: 6, lineHeight: 20 },
  resultNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 10, lineHeight: 16 },
  copyBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  copyText: { color: COLORS.text, fontWeight: '600' },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
