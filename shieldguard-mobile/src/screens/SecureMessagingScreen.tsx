import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants';
import { familyApi, FamilyView, FamilyMember, syncApi, SyncItem } from '../services/api';
import { encryptJson, decryptJson, hashPin } from '../services/crypto';
import { getDeviceId } from '../services/device';
import { auditLog } from '../services/auditLog';

interface ChatMessage {
  id: string;
  from: string;
  fromMe: boolean;
  text: string;
  at: number;
}

const PASSPHRASE_HASH_KEY = 'shieldguard_team_passphrase_hash';

export function SecureMessagingScreen() {
  const deviceId = getDeviceId();
  const [family, setFamily] = useState<FamilyView | null>(null);
  const [loading, setLoading] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseSet, setPassphraseSet] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fam = await familyApi.get(deviceId);
      setFamily(fam);
      const stored = await (await import('../services/crypto')).secureGet(PASSPHRASE_HASH_KEY);
      setPassphraseSet(!!stored);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const setPassphraseNow = async () => {
    if (passphrase.trim().length < 4) {
      Alert.alert('Passphrase', 'Use at least 4 characters for the team key.');
      return;
    }
    await (await import('../services/crypto')).secureSet(
      PASSPHRASE_HASH_KEY,
      await hashPin(passphrase.trim())
    );
    setPassphraseSet(true);
    setPassphrase('');
    await auditLog.add('messaging_passphrase_set');
    pullMessages();
  };

  const pullMessages = useCallback(async () => {
    if (!family) return;
    const stored = await (await import('../services/crypto')).secureGet(PASSPHRASE_HASH_KEY);
    if (!stored) return;
    setBusy(true);
    try {
      const res = await syncApi.pull(`chat:${family.id}`);
      const items: SyncItem[] = res.items || [];
      const decrypted: ChatMessage[] = [];
      for (const item of items) {
        try {
          const msg = decryptJson<{ to: string; text: string; at: number }>(item.ciphertext, stored);
          decrypted.push({
            id: item.id,
            from: msg.to === deviceId ? deviceId : item.deviceId,
            fromMe: item.deviceId === deviceId,
            text: msg.text,
            at: msg.at,
          });
        } catch {
          // ciphertext from a different key / malformed — skip
        }
      }
      decrypted.sort((a, b) => a.at - b.at);
      setMessages(decrypted);
    } catch {
      // offline — keep what we have
    } finally {
      setBusy(false);
    }
  }, [family]);

  useEffect(() => {
    if (passphraseSet && family) pullMessages();
  }, [passphraseSet, family, pullMessages]);

  const send = async () => {
    if (!family || !draft.trim()) return;
    const stored = await (await import('../services/crypto')).secureGet(PASSPHRASE_HASH_KEY);
    if (!stored) return;
    const payload = encryptJson({ to: '*', text: draft.trim(), at: Date.now() }, stored);
    setBusy(true);
    try {
      await syncApi.push(`chat:${family.id}`, payload, 'msg');
      setDraft('');
      await auditLog.add('messaging_sent');
      await pullMessages();
    } catch {
      Alert.alert('Send failed', 'Could not deliver the message (needs connectivity).');
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
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.title}>Team Messaging</Text>
        <Text style={styles.subtitle}>Join a Family plan to use team messaging.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Secure Messaging</Text>
        <Text style={styles.subtitle}>Family: {family.name}</Text>
      </View>

      {!passphraseSet ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Set a team passphrase</Text>
          <Text style={styles.hint}>
            This passphrase derives the shared key used to encrypt messages. All members must use the same one. The hash is stored only on this device.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Team passphrase"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            value={passphrase}
            onChangeText={setPassphrase}
          />
          <TouchableOpacity style={styles.btn} onPress={setPassphraseNow}>
            <Text style={styles.btnText}>Save passphrase</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
            {messages.length === 0 && <Text style={styles.empty}>No messages yet. Say hello.</Text>}
            {messages.map((m) => (
              <View key={m.id} style={[styles.bubble, m.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={styles.bubbleText}>{m.text}</Text>
                <Text style={styles.bubbleTime}>{new Date(m.at).toLocaleTimeString()}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput
              style={styles.composerInput}
              placeholder="Message your family…"
              placeholderTextColor={COLORS.textSecondary}
              value={draft}
              onChangeText={setDraft}
            />
            <TouchableOpacity style={styles.sendBtn} disabled={busy} onPress={send}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          Simplified shared-key encryption relayed via ShieldGuard. Not a Signal-grade protocol — anyone with the passphrase can read the thread.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: 24 },
  header: { alignItems: 'center', padding: 16, paddingBottom: 8 },
  icon: { fontSize: 40, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, margin: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 18 },
  input: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, fontSize: 14 },
  btn: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#04121E', fontSize: 14, fontWeight: 'bold' },
  messages: { flex: 1, paddingHorizontal: 12 },
  messagesContent: { paddingVertical: 12 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 10, marginBottom: 8 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: COLORS.safe + '30', borderWidth: 1, borderColor: COLORS.safe },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { color: COLORS.text, fontSize: 14 },
  bubbleTime: { color: COLORS.textSecondary, fontSize: 10, marginTop: 4, textAlign: 'right' },
  composer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.primary },
  composerInput: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, fontSize: 14 },
  sendBtn: { marginLeft: 8, backgroundColor: COLORS.safe, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  sendText: { color: '#04121E', fontWeight: 'bold' },
  honest: { padding: 12, backgroundColor: COLORS.warning + '12', borderTopWidth: 1, borderTopColor: COLORS.warning + '40' },
  honestText: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },
});
