import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';
import { PinGate } from '../components/PinGate';
import { encryptJson, decryptJson, randomPassword } from '../services/crypto';
import { passwordApi, PasswordItem } from '../services/api';

interface PwContent { password: string; notes: string; }

function strengthOf(pw: string): number {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 20) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(5, score) + 1; // 1-6
}

function strengthBadge(s: number): { label: string; color: string } {
  if (s <= 2) return { label: 'Weak', color: COLORS.danger };
  if (s <= 4) return { label: 'Fair', color: COLORS.warning };
  return { label: 'Strong', color: COLORS.safe };
}

function ManagerInner() {
  const { pin } = useVault();
  const [items, setItems] = useState<PasswordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [gen, setGen] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [revealId, setRevealId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await passwordApi.list()); } catch (e: any) {
      Alert.alert('Load failed', e?.message || 'Could not load passwords.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const regenerate = () => setGen(randomPassword(20));

  const save = async () => {
    if (!name.trim()) { Alert.alert('Name required', 'Label this password (e.g. "Gmail").'); return; }
    if (!gen) { Alert.alert('Password required', 'Generate or type a password.'); return; }
    setBusy(true);
    try {
      const content: PwContent = { password: gen, notes };
      await passwordApi.create({ name: name.trim(), username: username.trim() || undefined, siteUrl: siteUrl.trim() || undefined, payload: encryptJson(content, pin!), strength: strengthOf(gen) });
      setName(''); setUsername(''); setSiteUrl(''); setGen(''); setNotes(''); setAdding(false);
      await load();
    } catch (e: any) { Alert.alert('Save failed', e?.message || 'Could not save.'); }
    finally { setBusy(false); }
  };

  const reveal = async (it: PasswordItem) => {
    if (revealId === it.id) { setRevealId(null); setRevealed(null); return; }
    try {
      const c = decryptJson<PwContent>(it.payload, pin!);
      setRevealed(c.password);
      setRevealId(it.id);
    } catch { Alert.alert('Decrypt failed', 'Wrong PIN or corrupted entry.'); }
  };

  const copy = (text: string) => {
    try { const { Clipboard } = require('react-native'); Clipboard.setString(text); Alert.alert('Copied', 'Password copied to clipboard (clear it after use).'); }
    catch { Alert.alert('Copy unavailable', 'Clipboard not available on this platform.'); }
  };

  const remove = (it: PasswordItem) => {
    Alert.alert('Delete', `Remove "${it.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await passwordApi.remove(it.id); await load(); } },
    ]);
  };

  const weak = items.filter((i) => (i.strength ?? 0) <= 2).length;

  if (adding) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setAdding(false)}><Text style={styles.backLink}>← Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>New Password</Text>
        <TextInput style={styles.input} placeholder="Name / site (e.g. Gmail)" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Username / email (optional)" placeholderTextColor={COLORS.textSecondary} autoCapitalize="none" value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Site URL (optional)" placeholderTextColor={COLORS.textSecondary} autoCapitalize="none" value={siteUrl} onChangeText={setSiteUrl} />
        <View style={styles.genRow}>
          <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Password" placeholderTextColor={COLORS.textSecondary} secureTextEntry value={gen} onChangeText={setGen} />
          <TouchableOpacity style={styles.genBtn} onPress={regenerate}><Text style={styles.genBtnText}>⚡ Gen</Text></TouchableOpacity>
        </View>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Notes (optional, encrypted)" placeholderTextColor={COLORS.textSecondary} value={notes} onChangeText={setNotes} multiline />
        <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={save}>
          <Text style={styles.primaryButtonText}>{busy ? 'Encrypting…' : 'Encrypt & Save'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔑</Text>
        <Text style={styles.title}>Password Manager</Text>
        <Text style={styles.subtitle}>Encrypted on this device. ShieldGuard cannot read it.</Text>
      </View>

      <View style={styles.healthCard}>
        <Text style={styles.healthLabel}>Password health</Text>
        <Text style={styles.healthValue}>{items.length} stored • {weak} flagged weak</Text>
        <Text style={styles.healthNote}>Reuse detection is limited: we can only assess local entries, and only by strength — reuse across sites is unknown while stored encrypted.</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => { regenerate(); setAdding(true); }}>
        <Text style={styles.primaryButtonText}>+ Add Password</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color={COLORS.safe} style={{ marginTop: 20 }} /> : (
        <View style={styles.section}>
          {items.length === 0 && <Text style={styles.emptyText}>No passwords yet.</Text>}
          {items.map((it) => {
            const b = strengthBadge(it.strength ?? 1);
            return (
              <View key={it.id} style={styles.entryItem}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryName}>{it.name}</Text>
                  <Text style={styles.entryUser}>{it.username || it.siteUrl || 'no account'}</Text>
                  <View style={[styles.badge, { backgroundColor: b.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
                  </View>
                  {revealId === it.id && revealed && (
                    <Text style={styles.revealText} selectable>{revealed}</Text>
                  )}
                </View>
                <View style={styles.entryActions}>
                  <TouchableOpacity onPress={() => reveal(it)}><Text style={styles.entryAction}>{revealId === it.id ? 'Hide' : 'Reveal'}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => reveal(it).then(() => revealed && copy(revealed))}><Text style={styles.entryAction}>Copy</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(it)}><Text style={[styles.entryAction, { color: COLORS.danger }]}>Delete</Text></TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

export function PasswordManagerScreen() {
  return <PinGate title="Passwords Locked" subtitle="Enter your PIN to decrypt your passwords."><ManagerInner /></PinGate>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, width: '100%' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  genRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  genBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 14, marginLeft: 8 },
  genBtnText: { color: COLORS.text, fontWeight: '700' },
  healthCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  healthLabel: { fontSize: 12, color: COLORS.textSecondary },
  healthValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },
  healthNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6, lineHeight: 16 },
  section: { marginTop: 8 },
  entryItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  entryInfo: { marginRight: 8 },
  entryName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  entryUser: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  revealText: { fontSize: 13, color: COLORS.accent, marginTop: 6 },
  entryActions: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8 },
  entryAction: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginRight: 16 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 16 },
  backLink: { fontSize: 14, color: COLORS.accent, marginBottom: 12 },
});
