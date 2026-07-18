import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { COLORS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auditLog } from '../services/auditLog';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

const CONTACTS_KEY = 'shieldguard_secure_call_contacts';

export function SecureCallScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CONTACTS_KEY);
      if (raw) setContacts(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (next: Contact[]) => {
    setContacts(next);
    try {
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const addContact = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Add contact', 'Provide both a name and a phone number.');
      return;
    }
    save([...contacts, { id: `c_${Date.now()}`, name: name.trim(), phone: phone.trim() }]);
    setName('');
    setPhone('');
  };

  const removeContact = (id: string) => save(contacts.filter((c) => c.id !== id));

  const call = (num: string) => {
    Linking.openURL(`tel:${num.replace(/[^+\d]/g, '')}`).catch(() => {
      Alert.alert('Call', 'Could not open the dialer on this device.');
    });
  };

  const facetime = (num: string) => {
    Linking.openURL(`facetime:${num.replace(/[^+\d]/g, '')}`).catch(() => {
      Alert.alert('FaceTime', 'FaceTime is not available on this device.');
    });
  };

  const signal = (num: string) => {
    Linking.openURL(`signal://${num.replace(/[^+\d]/g, '')}`).catch(() => {
      Alert.alert('Signal', 'Signal is not installed.');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📞</Text>
        <Text style={styles.title}>Secure Call</Text>
        <Text style={styles.subtitle}>Reach your emergency contacts through their apps.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add a contact</Text>
        <TextInput style={styles.input} placeholder="Name" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={COLORS.textSecondary} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TouchableOpacity style={styles.btn} onPress={addContact}>
          <Text style={styles.btnText}>Add contact</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Contacts</Text>
      {contacts.length === 0 && <Text style={styles.empty}>No contacts yet.</Text>}
      {contacts.map((c) => (
        <View key={c.id} style={styles.contactRow}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactPhone}>{c.phone}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.callBtn} onPress={() => call(c.phone)}>
              <Text style={styles.callText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ftBtn} onPress={() => facetime(c.phone)}>
              <Text style={styles.callText}>FT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sigBtn} onPress={() => signal(c.phone)}>
              <Text style={styles.callText}>Sig</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeContact(c.id)}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          Opens your device's caller or a supported app (FaceTime, Signal). ShieldGuard does not provide in-app encrypted calling — call confidentiality depends on the app you choose.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 40, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  input: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, fontSize: 14 },
  btn: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#04121E', fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 },
  contactRow: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  contactInfo: { flex: 1, marginRight: 8 },
  contactName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  contactPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  callBtn: { backgroundColor: COLORS.safe, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6 },
  ftBtn: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6 },
  sigBtn: { backgroundColor: COLORS.warning, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginRight: 6 },
  callText: { color: '#04121E', fontSize: 12, fontWeight: 'bold' },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.danger + '20', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: COLORS.danger, fontSize: 13, fontWeight: 'bold' },
  honest: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.warning + '40' },
  honestText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
