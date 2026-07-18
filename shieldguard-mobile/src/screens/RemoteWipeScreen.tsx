import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { familyApi, FamilyView, commandApi } from '../services/api';
import { getDeviceId } from '../services/device';
import { clearLocalData } from '../services/crypto';
import { useVault } from '../context/VaultContext';
import { auditLog } from '../services/auditLog';

export function RemoteWipeScreen() {
  const deviceId = getDeviceId();
  const { lock } = useVault();
  const [family, setFamily] = useState<FamilyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const fam = await familyApi.get(deviceId);
      setFamily(fam);
    } catch {
      setFamily(null);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [load]);

  // Check for pending remote commands targeting this device.
  const checkCommands = useCallback(async () => {
    try {
      const res = await commandApi.pending();
      const mine = (res.commands || []).filter((c) => c.targetDeviceId === deviceId && c.status === 'pending');
      for (const cmd of mine) {
        if (cmd.type === 'wipe') {
          await auditLog.add('remote_wipe_executed');
          await clearLocalData();
          lock();
          Alert.alert('Remote wipe', 'A remote wipe command was received. Local data has been cleared and the vault locked.');
          await commandApi.ack(cmd.id).catch(() => undefined);
        } else if (cmd.type === 'lock') {
          lock();
          Alert.alert('Remote lock', 'A remote lock command was received. The vault is now locked.');
          await commandApi.ack(cmd.id).catch(() => undefined);
        } else {
          Alert.alert('Remote notice', 'You received a remote notification command.');
          await commandApi.ack(cmd.id).catch(() => undefined);
        }
      }
    } catch {
      // offline — nothing to do
    }
  }, [deviceId, lock]);

  useEffect(() => {
    checkCommands();
    intervalRef.current = setInterval(checkCommands, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkCommands]);

  const issue = async (targetDeviceId: string, type: 'wipe' | 'lock' | 'notify') => {
    setBusy(true);
    try {
      await commandApi.issue(targetDeviceId, type);
      Alert.alert('Command sent', `Issued "${type}" to a family member. It applies next time their app is open with connectivity.`);
      await auditLog.add(`remote_command_issued_${type}`);
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not issue command.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.safe} />
      </View>
    );
  }

  if (!family) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.title}>Remote Device Management</Text>
        <Text style={styles.subtitle}>Join a Family plan to manage devices.</Text>
      </View>
    );
  }

  if (family.role !== 'owner') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>🛡️</Text>
          <Text style={styles.title}>Remote Device Management</Text>
          <Text style={styles.subtitle}>Only the family owner can issue remote commands. The app checks for commands targeting this device automatically.</Text>
        </View>
        <View style={styles.memberCard}>
          <Text style={styles.memberText}>You are a member. This device listens for owner commands automatically.</Text>
        </View>
        <View style={styles.honest}>
          <Text style={styles.honestText}>
            Best-effort: a remote wipe/lock only applies when the target device is open with connectivity. ShieldGuard cannot guarantee enforcement on a powered-off or offline device.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>👑</Text>
        <Text style={styles.title}>Remote Device Management</Text>
        <Text style={styles.subtitle}>Family: {family.name}</Text>
      </View>

      <Text style={styles.sectionTitle}>Members</Text>
      {family.members.map((m, i) => (
        <View key={i} style={styles.memberRow}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{m.name || m.email || m.phone || 'Member'}{m.isYou ? ' (You)' : ''}</Text>
            <Text style={styles.memberContact}>{m.status}</Text>
          </View>
          {!m.isYou && (
            <View style={styles.cmdActions}>
              <TouchableOpacity style={styles.wipeBtn} disabled={busy} onPress={() => issue(m.email || m.phone || '', 'wipe')}>
                <Text style={styles.cmdText}>Wipe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lockBtn} disabled={busy} onPress={() => issue(m.email || m.phone || '', 'lock')}>
                <Text style={styles.cmdText}>Lock</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.noteBtn} disabled={busy} onPress={() => issue(m.email || m.phone || '', 'notify')}>
                <Text style={styles.cmdText}>Notify</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          Best-effort remote control. Commands only take effect when the target device is open with connectivity. ShieldGuard cannot force a wipe on a device that is off or disconnected.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 40, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  memberRow: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  memberInfo: { flex: 1, marginRight: 8 },
  memberName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  memberContact: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  memberCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  memberText: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  cmdActions: { flexDirection: 'row' },
  wipeBtn: { backgroundColor: COLORS.danger, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6 },
  lockBtn: { backgroundColor: COLORS.warning, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6 },
  noteBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  cmdText: { color: '#04121E', fontWeight: 'bold', fontSize: 12 },
  honest: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  honestText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
