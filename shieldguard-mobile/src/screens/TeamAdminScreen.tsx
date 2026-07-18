import React, { useCallback, useEffect, useState } from 'react';
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
import { familyApi, FamilyView, FamilyMember } from '../services/api';
import { getDeviceId } from '../services/device';
import { auditLog } from '../services/auditLog';

export function TeamAdminScreen() {
  const deviceId = getDeviceId();
  const [view, setView] = useState<FamilyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPhone, setInvPhone] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fam = await familyApi.get(deviceId);
      setView(fam);
    } catch {
      setView(null);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = status === 403 ? 'Only the family owner can do that.' : err?.message || 'Something went wrong.';
      Alert.alert('Team admin', msg);
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = () => {
    if (!invEmail.trim() && !invPhone.trim()) {
      Alert.alert('Invite', 'Provide an email or phone number.');
      return;
    }
    withBusy(async () => {
      const updated = await familyApi.invite(deviceId, {
        name: invName.trim() || undefined,
        email: invEmail.trim() || undefined,
        phone: invPhone.trim() || undefined,
      });
      setView(updated);
      await auditLog.add('team_invite');
      setInvName('');
      setInvEmail('');
      setInvPhone('');
    });
  };

  const handleRemove = (memberDeviceId: string, memberName?: string) => {
    Alert.alert('Remove member', `Remove ${memberName || 'this member'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          withBusy(async () => {
            const updated = await familyApi.removeMember(deviceId, memberDeviceId || '');
            setView(updated);
            await auditLog.add('team_remove_member');
          }),
      },
    ]);
  };

  const handleLeave = () => {
    Alert.alert('Leave family', 'You will lose team-admin access. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () =>
          withBusy(async () => {
            await familyApi.leave(deviceId);
            setView(null);
            await auditLog.add('team_leave');
          }),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.safe} />
      </View>
    );
  }

  if (!view) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>👥</Text>
        <Text style={styles.title}>Team Administration</Text>
        <Text style={styles.subtitle}>Join a Family plan to administer team devices.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>{view.role === 'owner' ? '👑' : '👥'}</Text>
        <Text style={styles.title}>{view.name}</Text>
        <Text style={styles.subtitle}>
          {view.role === 'owner' ? 'Owner · ' : 'Member · '}
          {view.deviceCount} / {view.deviceLimit} devices
        </Text>
      </View>

      {view.role === 'owner' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite a member</Text>
          <TextInput style={styles.input} placeholder="Name (optional)" placeholderTextColor={COLORS.textSecondary} value={invName} onChangeText={setInvName} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.textSecondary} autoCapitalize="none" keyboardType="email-address" value={invEmail} onChangeText={setInvEmail} />
          <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={COLORS.textSecondary} keyboardType="phone-pad" value={invPhone} onChangeText={setInvPhone} />
          <TouchableOpacity style={styles.btn} disabled={busy} onPress={handleInvite}>
            <Text style={styles.btnText}>{busy ? 'Inviting…' : 'Send Invite'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Members</Text>
      {view.members.map((m: FamilyMember, i: number) => (
        <View key={i} style={styles.memberRow}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {m.name || m.email || m.phone || 'Member'}
              {m.isYou ? ' (You)' : ''}
            </Text>
            <Text style={styles.memberContact}>{m.email || m.phone || ''}</Text>
          </View>
          <View style={[styles.statusBadge, m.status === 'active' ? styles.statusActive : styles.statusPending]}>
            <Text style={styles.statusText}>{m.status}</Text>
          </View>
          {view.role === 'owner' && !m.isYou && (
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(m.email || m.phone || '', m.name || m.email || m.phone)}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {view.role === 'member' && (
        <TouchableOpacity style={styles.leaveBtn} disabled={busy} onPress={handleLeave}>
          <Text style={styles.leaveText}>{busy ? 'Leaving…' : 'Leave family'}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          Team administration is managed within your Family plan. These controls mirror the Family engine; only the owner can invite or remove members.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: 24 },
  header: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  input: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, fontSize: 14 },
  btn: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#04121E', fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  memberRow: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  memberInfo: { flex: 1, marginRight: 8 },
  memberName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  memberContact: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusActive: { backgroundColor: COLORS.safe + '20', borderColor: COLORS.safe },
  statusPending: { backgroundColor: COLORS.warning + '20', borderColor: COLORS.warning },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  removeBtn: { marginLeft: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.danger + '20', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: COLORS.danger, fontSize: 14, fontWeight: 'bold' },
  leaveBtn: { backgroundColor: COLORS.danger + '20', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger, marginTop: 8 },
  leaveText: { color: COLORS.danger, fontSize: 14, fontWeight: 'bold' },
  honest: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.warning + '40' },
  honestText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
