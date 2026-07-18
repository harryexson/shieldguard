import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';
import { PinGate } from '../components/PinGate';
import { familyApi, FamilyView, syncApi, SyncItem, vaultApi, VaultItem } from '../services/api';
import { encryptJson, decryptJson } from '../services/crypto';
import { getDeviceId } from '../services/device';
import { auditLog } from '../services/auditLog';

interface ExportItem {
  id: string;
  folder: string;
  name: string;
  kind: string;
  mimeType: string;
  payload: string;
}

function DeviceSyncInner() {
  const { pin } = useVault();
  const deviceId = getDeviceId();
  const [family, setFamily] = useState<FamilyView | null>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const fam = await familyApi.get(deviceId);
      setFamily(fam);
    } catch {
      setFamily(null);
    }
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const syncNow = async () => {
    if (!family) return;
    setBusy(true);
    try {
      const metas = await vaultApi.list();
      const items: ExportItem[] = [];
      for (const m of metas) {
        try {
          const full: VaultItem = await vaultApi.get(m.id);
          items.push({ id: full.id, folder: full.folder, name: full.name, kind: full.kind, mimeType: full.mimeType, payload: full.payload });
        } catch {
          // skip
        }
      }
      const exportObj = { version: 1, exportedAt: Date.now(), items };
      const ciphertext = encryptJson(exportObj, pin!);
      await syncApi.push(`sync:${family.id}`, ciphertext, 'backup');
      setSummary(`Encrypted ${items.length} item(s) to the family sync channel. Server stores only ciphertext.`);
      await auditLog.add('device_sync_push');
    } catch (e: any) {
      Alert.alert('Sync failed', e?.message || 'Could not sync.');
    } finally {
      setBusy(false);
    }
  };

  const pull = async () => {
    if (!family) return;
    setBusy(true);
    try {
      const res = await syncApi.pull(`sync:${family.id}`);
      const items: SyncItem[] = res.items || [];
      if (items.length === 0) {
        setSummary('No synced backup found on this channel.');
        return;
      }
      // Decrypt the most recent backup blob.
      const latest = items.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      try {
        const data = decryptJson<{ items: ExportItem[] }>(latest.ciphertext, pin!);
        setSummary(`Pulled ${data.items.length} item(s) from sync (decrypted locally with your PIN).`);
      } catch {
        setSummary(`Found ${items.length} encrypted backup(s) but could not decrypt with your PIN.`);
      }
      await auditLog.add('device_sync_pull');
    } catch {
      Alert.alert('Pull failed', 'Could not reach the sync server.');
    } finally {
      setBusy(false);
    }
  };

  if (!family) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>🔄</Text>
        <Text style={styles.title}>Device Sync</Text>
        <Text style={styles.subtitle}>Join a Family plan and unlock your vault to sync encrypted data.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔄</Text>
        <Text style={styles.title}>Encrypted Device Sync</Text>
        <Text style={styles.subtitle}>Family: {family.name}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={syncNow}>
        <Text style={styles.primaryButtonText}>{busy ? 'Syncing…' : 'Sync now (push encrypted)'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: COLORS.accent }]} disabled={busy} onPress={pull}>
        <Text style={styles.primaryButtonText}>Pull (decrypt & preview)</Text>
      </TouchableOpacity>

      {summary && (
        <View style={styles.resultCard}>
          <Text style={styles.resultValue}>{summary}</Text>
        </View>
      )}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          Your vault items are encrypted with your PIN before they ever leave the device. The server only relays ciphertext — it cannot read your data. Sync requires both devices to share the same PIN/family.
        </Text>
      </View>
    </ScrollView>
  );
}

export function DeviceSyncScreen() {
  return (
    <PinGate title="Sync Locked" subtitle="Unlock your vault to sync encrypted data.">
      <DeviceSyncInner />
    </PinGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: 24 },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 40, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  resultCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.safe },
  resultValue: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  honest: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  honestText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
