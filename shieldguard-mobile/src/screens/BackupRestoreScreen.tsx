import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';
import { PinGate } from '../components/PinGate';
import { encryptJson, decryptJson } from '../services/crypto';
import { vaultApi, backupApi, VaultItem } from '../services/api';

interface ExportItem { id: string; folder: string; name: string; kind: string; mimeType: string; payload: string; }

function BackupInner() {
  const { pin } = useVault();
  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState<{ name?: string; createdAt: number } | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<string | null>(null);
  const [restoreCount, setRestoreCount] = useState<number | null>(null);

  const refreshLatest = useCallback(async () => {
    try {
      const rec: any = await backupApi.getLatest();
      if (rec && !rec.error && rec.createdAt) setLastBackup({ name: rec.name, createdAt: rec.createdAt });
      else setLastBackup(null);
    } catch { setLastBackup(null); }
  }, []);

  useEffect(() => { refreshLatest(); }, [refreshLatest]);

  const backup = useCallback(async () => {
    setBusy(true);
    try {
      const metas = await vaultApi.list();
      const items: ExportItem[] = [];
      for (const m of metas) {
        try {
          const full: VaultItem = await vaultApi.get(m.id);
          items.push({ id: full.id, folder: full.folder, name: full.name, kind: full.kind, mimeType: full.mimeType, payload: full.payload });
        } catch { /* skip unreadable */ }
      }
      const exportObj = { version: 1, exportedAt: Date.now(), items };
      const ciphertext = encryptJson(exportObj, pin!);
      const name = `ShieldGuard backup ${new Date().toLocaleDateString()}`;
      await backupApi.export(ciphertext, name);
      setLastBackup({ name, createdAt: Date.now() });
      Alert.alert('Backup complete', `Encrypted ${items.length} item(s) to your backup. The server stores only ciphertext.`);
    } catch (e: any) {
      Alert.alert('Backup failed', e?.message || 'Could not export vault.');
    } finally { setBusy(false); }
  }, [pin]);

  const restore = useCallback(async () => {
    setBusy(true);
    setRestoreSummary(null);
    setRestoreCount(null);
    try {
      const rec: any = await backupApi.getLatest();
      if (!rec || rec.error || !rec.ciphertext) {
        Alert.alert('No backup', 'There is no backup available to restore.');
        return;
      }
      const data = decryptJson<{ version: number; exportedAt: number; items: ExportItem[] }>(rec.ciphertext, pin!);
      setRestoreCount(data.items.length);
      setRestoreSummary(`Decrypted backup from ${new Date(data.exportedAt).toLocaleString()} with ${data.items.length} item(s).`);
    } catch (e: any) {
      Alert.alert('Restore failed', 'Could not decrypt — wrong PIN or corrupted backup.');
    } finally { setBusy(false); }
  }, [pin]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>💾</Text>
        <Text style={styles.title}>Backup & Restore</Text>
        <Text style={styles.subtitle}>Client-side encrypted backup of your vault to your own infra (ciphertext only).</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={backup}>
        <Text style={styles.primaryButtonText}>{busy ? 'Encrypting…' : 'Back Up Vault'}</Text>
      </TouchableOpacity>

      <View style={styles.lastCard}>
        <Text style={styles.lastLabel}>Last backup</Text>
        <Text style={styles.lastValue}>{lastBackup ? `${lastBackup.name || 'Backup'} — ${new Date(lastBackup.createdAt).toLocaleString()}` : 'No backup yet'}</Text>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.accent }]} disabled={busy} onPress={restore}>
        <Text style={styles.primaryButtonText}>Restore (decrypt & preview)</Text>
      </TouchableOpacity>

      {restoreSummary && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Restored</Text>
          <Text style={styles.resultValue}>{restoreSummary}</Text>
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          The backup contains all vault items as ciphertext encrypted with your PIN — including photos, notes, and passwords. The server cannot read it. To fully re-create items you would restore them via the vault API; here we decrypt and show a summary so you can verify the backup is intact. Losing your PIN means the backup is unrecoverable.
        </Text>
      </View>
    </ScrollView>
  );
}

export function BackupRestoreScreen() {
  return (
    <PinGate title="Backup Locked" subtitle="Unlock your vault to back up or restore encrypted data.">
      <BackupInner />
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
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  lastCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  lastLabel: { fontSize: 12, color: COLORS.textSecondary },
  lastValue: { fontSize: 14, color: COLORS.text, marginTop: 6, lineHeight: 20 },
  resultCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.safe },
  resultLabel: { fontSize: 12, color: COLORS.textSecondary },
  resultValue: { fontSize: 13, color: COLORS.text, marginTop: 6, lineHeight: 18 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
