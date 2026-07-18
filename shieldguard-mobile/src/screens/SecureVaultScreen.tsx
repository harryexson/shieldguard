import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';
import { PinGate } from '../components/PinGate';
import { encryptJson, decryptJson } from '../services/crypto';
import { vaultApi, decoyApi, VaultItemMeta, VaultItem, VaultKind } from '../services/api';

const FOLDERS = ['Personal', 'Finance', 'Medical', 'Family', 'Legal', 'Business', 'Passwords', 'Emergency', 'Hidden'];
const KINDS: VaultKind[] = ['photo', 'video', 'doc', 'audio', 'note', 'password', 'id'];
const DECOY_SAMPLES: { name: string; kind: VaultKind; content: any }[] = [
  { name: 'Grocery list', kind: 'note', content: { text: 'Milk, eggs, bread. Reminder to call the bank on Tuesday.' } },
  { name: 'Dad birthday', kind: 'note', content: { text: 'Book restaurant for dad’s birthday. Order flowers.' } },
];

function VaultInner() {
  const { pin, mode } = useVault();
  const api = mode === 'decoy' ? decoyApi : vaultApi;
  const [folder, setFolder] = useState<string>(FOLDERS[0]);
  const [items, setItems] = useState<VaultItemMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<VaultKind>('note');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<VaultItem | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [decoySeeded, setDecoySeeded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'decoy' && !decoySeeded) {
        const existing = await decoyApi.list();
        if (existing.length === 0) {
          for (const s of DECOY_SAMPLES) {
            await decoyApi.create({
              folder: 'Personal', name: s.name, kind: s.kind,
              mimeType: 'application/json', payload: encryptJson(s.content, pin!),
            });
          }
          setDecoySeeded(true);
        }
      }
      setItems(await api.list());
    } catch (e: any) {
      Alert.alert('Load failed', e?.message || 'Could not load vault.');
    } finally {
      setLoading(false);
    }
  }, [api, mode, decoySeeded, pin]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => i.folder === folder && i.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Name required', 'Give this item a name.'); return; }
    setBusy(true);
    try {
      const content: any = { text };
      if (kind === 'password') content.password = text;
      await api.create({
        folder, name: name.trim(), kind, mimeType: 'application/json',
        payload: encryptJson(content, pin!),
      });
      setName(''); setText(''); setKind('note'); setAdding(false);
      await load();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not encrypt and store item.');
    } finally { setBusy(false); }
  };

  const toggleFavorite = async (it: VaultItemMeta) => {
    try {
      await api.update(it.id, { favorite: !it.favorite });
      await load();
    } catch { /* ignore */ }
  };

  const handleDelete = (it: VaultItemMeta) => {
    Alert.alert('Delete', `Remove "${it.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.remove(it.id); await load(); } },
    ]);
  };

  const openItem = async (it: VaultItemMeta) => {
    setBusy(true);
    try {
      const full = await api.get(it.id);
      const content = decryptJson<{ text?: string; password?: string; dataUri?: string }>(full.payload, pin!);
      setViewing({ ...full, payload: full.payload });
      setRevealed(content.text || content.password || null);
    } catch (e: any) {
      Alert.alert('Decrypt failed', 'Wrong PIN or corrupted entry.');
    } finally { setBusy(false); }
  };

  if (viewing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => { setViewing(null); setRevealed(null); }}>
          <Text style={styles.backLink}>← Back to {folder}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{viewing.name}</Text>
        <Text style={styles.subtitle}>{viewing.kind} • {viewing.folder}</Text>
        {revealed ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteText} selectable>{revealed}</Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>Encrypted on this device. ShieldGuard cannot read it.</Text>
        )}
        <TouchableOpacity style={styles.primaryButton} onPress={() => setRevealed(null)}>
          <Text style={styles.primaryButtonText}>Hide</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.danger }]} onPress={() => handleDelete(viewing)}>
          <Text style={[styles.primaryButtonText, { color: COLORS.text }]}>Delete</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>{mode === 'decoy' ? '🕵️' : '🔐'}</Text>
        <Text style={styles.title}>Secure Vault{mode === 'decoy' ? ' (Decoy)' : ''}</Text>
        <Text style={styles.subtitle}>Zero-knowledge — encrypted on this device before sync</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderRow}>
        {FOLDERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.folderChip, f === folder && styles.folderChipActive]} onPress={() => setFolder(f)}>
            <Text style={[styles.folderText, f === folder && styles.folderTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput style={styles.input} placeholder="Search by name (local only)" placeholderTextColor={COLORS.textSecondary} value={search} onChangeText={setSearch} />

      <TouchableOpacity style={styles.primaryButton} onPress={() => setAdding((a) => !a)}>
        <Text style={styles.primaryButtonText}>{adding ? 'Cancel' : '+ Add Item'}</Text>
      </TouchableOpacity>

      {adding && (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="Name" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
          <View style={styles.kindRow}>
            {KINDS.map((k) => (
              <TouchableOpacity key={k} style={[styles.kindChip, k === kind && styles.kindChipActive]} onPress={() => setKind(k)}>
                <Text style={[styles.kindText, k === kind && styles.kindTextActive]}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder={`Content for ${kind}`} placeholderTextColor={COLORS.textSecondary} value={text} onChangeText={setText} multiline />
          <TouchableOpacity style={styles.saveButton} disabled={busy} onPress={handleAdd}>
            <Text style={styles.saveButtonText}>{busy ? 'Encrypting…' : 'Encrypt & Save'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.safe} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.section}>
          {filtered.length === 0 && <Text style={styles.emptyText}>No items in {folder}.</Text>}
          {filtered.map((it) => (
            <View key={it.id} style={styles.entryItem}>
              <TouchableOpacity style={styles.entryInfo} onPress={() => openItem(it)}>
                <Text style={styles.entryName}>{it.favorite ? '⭐ ' : ''}{it.name}</Text>
                <Text style={styles.entryUser}>{it.kind} • {it.mimeType}</Text>
              </TouchableOpacity>
              <View style={styles.entryActions}>
                <TouchableOpacity onPress={() => toggleFavorite(it)}>
                  <Text style={styles.entryAction}>{it.favorite ? 'Unfav' : 'Fav'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(it)}>
                  <Text style={[styles.entryAction, { color: COLORS.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          Search filters only item names stored locally. The ciphertext itself is never searchable — that is the point of zero-knowledge encryption.
        </Text>
      </View>
    </ScrollView>
  );
}

export function SecureVaultScreen() {
  return (
    <PinGate title="Vault Locked" subtitle="Enter your PIN to decrypt your secure vault.">
      <VaultInner />
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
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, width: '100%' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  folderRow: { marginBottom: 12 },
  folderChip: { backgroundColor: COLORS.card, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  folderChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  folderText: { fontSize: 13, color: COLORS.textSecondary },
  folderTextActive: { color: COLORS.text, fontWeight: '700' },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  kindChip: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 6, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  kindChipActive: { backgroundColor: COLORS.safe },
  kindText: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  kindTextActive: { color: COLORS.primary, fontWeight: '700' },
  formCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  saveButton: { backgroundColor: COLORS.safe, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: COLORS.primary, fontWeight: '700' },
  section: { marginTop: 8 },
  entryItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between' },
  entryInfo: { flex: 1, marginRight: 8 },
  entryName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  entryUser: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  entryActions: { justifyContent: 'space-around', alignItems: 'flex-end' },
  entryAction: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginVertical: 4 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 16 },
  noteCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  noteText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  backLink: { fontSize: 14, color: COLORS.accent, marginBottom: 12 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
