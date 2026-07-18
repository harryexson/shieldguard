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
import { useSubscription } from '../context/SubscriptionContext';
import { familyApi, FamilyView, FamilyMember } from '../services/api';
import { getDeviceId } from '../services/device';

export function FamilyScreen() {
  const { family, refresh } = useSubscription();
  const [view, setView] = useState<FamilyView | null>(family);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  // Invite form
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPhone, setInvPhone] = useState('');
  // Create family name
  const [createName, setCreateName] = useState('');

  const deviceId = getDeviceId();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fam = await familyApi.get(deviceId);
      setView(fam);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Could not load family.');
    } finally {
      setLoading(false);
    }
  }, [deviceId, refresh]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setView(family);
  }, [family]);

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 404
          ? 'Invalid invite code.'
          : status === 409
          ? 'This family is at its device limit (5).'
          : status === 403
          ? 'Only the family owner can do that.'
          : err?.message || 'Something went wrong.';
      Alert.alert('Family', msg);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () => withBusy(async () => {
    await familyApi.create(deviceId, createName.trim() || undefined);
    await load();
  });

  const handleJoin = () => {
    if (!joinCode.trim()) {
      Alert.alert('Family', 'Enter an invite code.');
      return;
    }
    withBusy(async () => {
      await familyApi.join(deviceId, joinCode.trim().toUpperCase(), joinName.trim() || undefined);
      await load();
    });
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
      setInvName('');
      setInvEmail('');
      setInvPhone('');
    });
  };

  const handleRemove = (memberDeviceId: string, memberName?: string) => {
    Alert.alert(
      'Remove member',
      `Remove ${memberName || 'this member'} from the family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            withBusy(async () => {
              const updated = await familyApi.removeMember(deviceId, memberDeviceId);
              setView(updated);
            }),
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert('Leave family', 'You will lose access to the family plan. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () =>
          withBusy(async () => {
            await familyApi.leave(deviceId);
            setView(null);
            await refresh();
          }),
      },
    ]);
  };

  const copyCode = (code: string) => {
    // Minimal clipboard copy without adding deps.
    try {
      // @ts-ignore — react-native clipboard may be available at runtime.
      require('react-native').Clipboard.setString(code);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.safe} />
      </View>
    );
  }

  if (error && !view) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Not in a family ───────────────────────────────────────────────
  if (!view) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.title}>Family Plan</Text>
          <Text style={styles.subtitle}>Protect up to 5 devices under one plan.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create a family</Text>
          <TextInput
            style={styles.input}
            placeholder="Family name (optional)"
            placeholderTextColor={COLORS.textSecondary}
            value={createName}
            onChangeText={setCreateName}
          />
          <TouchableOpacity style={styles.btn} disabled={busy} onPress={handleCreate}>
            <Text style={styles.btnText}>{busy ? 'Creating…' : 'Create Family'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join with invite code</Text>
          <TextInput
            style={styles.input}
            placeholder="Invite code"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="characters"
            value={joinCode}
            onChangeText={setJoinCode}
          />
          <TextInput
            style={styles.input}
            placeholder="Your name (optional)"
            placeholderTextColor={COLORS.textSecondary}
            value={joinName}
            onChangeText={setJoinName}
          />
          <TouchableOpacity style={styles.btn} disabled={busy} onPress={handleJoin}>
            <Text style={styles.btnText}>{busy ? 'Joining…' : 'Join Family'}</Text>
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.errorInline}>{error}</Text>}
      </ScrollView>
    );
  }

  // ─── Owner view ────────────────────────────────────────────────────
  if (view.role === 'owner') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>👑</Text>
          <Text style={styles.title}>{view.name}</Text>
          <Text style={styles.subtitle}>
            {view.deviceCount} / {view.deviceLimit} devices
          </Text>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Invite code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeValue}>{view.inviteCode}</Text>
            {view.inviteCode && (
              <TouchableOpacity style={styles.copyBtn} onPress={() => copyCode(view.inviteCode!)}>
                <Text style={styles.copyText}>Copy</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite a member</Text>
          <TextInput style={styles.input} placeholder="Name (optional)" placeholderTextColor={COLORS.textSecondary} value={invName} onChangeText={setInvName} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.textSecondary} autoCapitalize="none" keyboardType="email-address" value={invEmail} onChangeText={setInvEmail} />
          <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={COLORS.textSecondary} keyboardType="phone-pad" value={invPhone} onChangeText={setInvPhone} />
          <TouchableOpacity style={styles.btn} disabled={busy} onPress={handleInvite}>
            <Text style={styles.btnText}>{busy ? 'Inviting…' : 'Send Invite'}</Text>
          </TouchableOpacity>
        </View>

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
            {!m.isYou && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove('', m.name || m.email || m.phone)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {error && <Text style={styles.errorInline}>{error}</Text>}
      </ScrollView>
    );
  }

  // ─── Member view ───────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>👨‍👩‍👧‍👦</Text>
        <Text style={styles.title}>{view.name}</Text>
        <Text style={styles.subtitle}>You are a member of this family</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.memberRow}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>Your status</Text>
            <Text style={styles.memberContact}>{view.deviceCount} / {view.deviceLimit} devices covered</Text>
          </View>
          <View style={[styles.statusBadge, styles.statusActive]}>
            <Text style={styles.statusText}>active</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.leaveBtn} disabled={busy} onPress={handleLeave}>
        <Text style={styles.leaveText}>{busy ? 'Leaving…' : 'Leave family'}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorInline}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  header: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  input: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, fontSize: 14 },
  btn: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#04121E', fontSize: 14, fontWeight: 'bold' },
  codeCard: { backgroundColor: COLORS.accent + '18', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.accent },
  codeLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.safe, letterSpacing: 2 },
  copyBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  copyText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
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
  leaveBtn: { backgroundColor: COLORS.danger + '20', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.danger },
  leaveText: { color: COLORS.danger, fontSize: 14, fontWeight: 'bold' },
  errorText: { color: COLORS.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  errorInline: { color: COLORS.danger, fontSize: 12, textAlign: 'center', marginTop: 8 },
  retryBtn: { backgroundColor: COLORS.safe, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { color: '#04121E', fontWeight: 'bold' },
});
