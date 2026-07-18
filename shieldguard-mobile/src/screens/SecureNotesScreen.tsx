import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';
import { PinGate } from '../components/PinGate';
import { encryptJson, decryptJson } from '../services/crypto';
import { vaultApi, VaultItemMeta, VaultItem } from '../services/api';

interface NoteContent { title: string; body: string; }

function NotesInner() {
  const { pin } = useVault();
  const [items, setItems] = useState<VaultItemMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<VaultItemMeta | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<VaultItem | null>(null);
  const [revealed, setRevealed] = useState<NoteContent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await vaultApi.list();
      setItems(all.filter((i) => i.kind === 'note'));
    } catch (e: any) {
      Alert.alert('Load failed', e?.message || 'Could not load notes.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startAdd = () => { setEditing(null); setTitle(''); setBody(''); setAdding(true); };
  const startEdit = (it: VaultItemMeta) => {
    setBusy(true);
    vaultApi.get(it.id).then((full) => {
      const c = decryptJson<NoteContent>(full.payload, pin!);
      setTitle(c.title || ''); setBody(c.body || '');
      setEditing(it); setAdding(true);
    }).catch(() => Alert.alert('Decrypt failed', 'Wrong PIN or corrupted note.')).finally(() => setBusy(false));
  };

  const save = async () => {
    if (!title.trim()) { Alert.alert('Title required', 'Give the note a title.'); return; }
    setBusy(true);
    try {
      const content: NoteContent = { title: title.trim(), body };
      if (editing) {
        await vaultApi.update(editing.id, { name: title.trim(), payload: encryptJson(content, pin!) });
      } else {
        await vaultApi.create({ folder: 'Personal', name: title.trim(), kind: 'note', mimeType: 'application/json', payload: encryptJson(content, pin!) });
      }
      setAdding(false); setEditing(null); setTitle(''); setBody('');
      await load();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not save note.');
    } finally { setBusy(false); }
  };

  const remove = (it: VaultItemMeta) => {
    Alert.alert('Delete note', `Remove "${it.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await vaultApi.remove(it.id); await load(); } },
    ]);
  };

  const open = async (it: VaultItemMeta) => {
    setBusy(true);
    try {
      const full = await vaultApi.get(it.id);
      setRevealed(decryptJson<NoteContent>(full.payload, pin!));
      setViewing(full);
    } catch { Alert.alert('Decrypt failed', 'Wrong PIN or corrupted note.'); }
    finally { setBusy(false); }
  };

  if (viewing && revealed) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => { setViewing(null); setRevealed(null); }}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{revealed.title}</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteText} selectable>{revealed.body || '(empty)'}</Text>
        </View>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.danger }]} onPress={() => remove(viewing)}>
          <Text style={[styles.primaryButtonText, { color: COLORS.text }]}>Delete</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (adding) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => { setAdding(false); setEditing(null); }}>
          <Text style={styles.backLink}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Edit Note' : 'New Note'}</Text>
        <TextInput style={styles.input} placeholder="Title" placeholderTextColor={COLORS.textSecondary} value={title} onChangeText={setTitle} />
        <TextInput style={[styles.input, { height: 180, textAlignVertical: 'top' }]} placeholder="Note body (encrypted on device)" placeholderTextColor={COLORS.textSecondary} value={body} onChangeText={setBody} multiline />
        <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={save}>
          <Text style={styles.primaryButtonText}>{busy ? 'Encrypting…' : 'Encrypt & Save'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📝</Text>
        <Text style={styles.title}>Secure Notes</Text>
        <Text style={styles.subtitle}>Encrypted on this device. ShieldGuard cannot read it.</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={startAdd}>
        <Text style={styles.primaryButtonText}>+ New Note</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color={COLORS.safe} style={{ marginTop: 20 }} /> : (
        <View style={styles.section}>
          {items.length === 0 && <Text style={styles.emptyText}>No notes yet.</Text>}
          {items.map((it) => (
            <View key={it.id} style={styles.entryItem}>
              <TouchableOpacity style={styles.entryInfo} onPress={() => open(it)}>
                <Text style={styles.entryName}>{it.name}</Text>
                <Text style={styles.entryUser}>note • encrypted</Text>
              </TouchableOpacity>
              <View style={styles.entryActions}>
                <TouchableOpacity onPress={() => startEdit(it)}><Text style={styles.entryAction}>Edit</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => remove(it)}><Text style={[styles.entryAction, { color: COLORS.danger }]}>Delete</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export function SecureNotesScreen() {
  return <PinGate title="Notes Locked" subtitle="Enter your PIN to decrypt your secure notes."><NotesInner /></PinGate>;
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
});
