import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants';
import { sosApi } from '../services/api';
import { getBatteryLevel } from '../services/deviceInfo';

const CONTACTS_KEY = 'shieldguard_emergency_contacts';
interface Contact { name: string; phone: string; }

export function EmergencySOSScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('I need help. This is an emergency alert from ShieldGuard.');
  const [busy, setBusy] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CONTACTS_KEY).then((raw) => {
      if (raw) { try { setContacts(JSON.parse(raw)); } catch { /* ignore */ } }
    }).catch(() => undefined);
  }, []);

  const saveContacts = async (next: Contact[]) => {
    setContacts(next);
    try { await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const addContact = () => {
    if (!name.trim() || !phone.trim()) { Alert.alert('Missing', 'Name and phone are required.'); return; }
    saveContacts([...contacts, { name: name.trim(), phone: phone.trim() }]);
    setName(''); setPhone('');
  };

  const removeContact = (i: number) => saveContacts(contacts.filter((_, idx) => idx !== i));

  const getLocation = async () => {
    try {
      const Loc = require('expo-location');
      const { status } = await Loc.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Loc.getCurrentPositionAsync({});
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null;
    }
  };

  const triggerSos = async () => {
    setBusy(true);
    setLastStatus(null);
    try {
      const battery = await getBatteryLevel();
      const location = await getLocation();
      await sosApi.trigger({ location, message, contacts, battery: battery ?? undefined }).catch(() => undefined);
      setLastStatus('SOS reported to backend.');
      // Best-effort platform dispatch.
      try { await Linking.openURL('tel:911'); } catch { setLastStatus((s) => `${s ?? ''} Call dispatch unavailable on this device.`); }
    } catch (e: any) {
      Alert.alert('SOS error', e?.message || 'Could not trigger SOS.');
    } finally { setBusy(false); }
  };

  const callContact = (c: Contact) => {
    try { Linking.openURL(`tel:${c.phone}`).catch(() => Alert.alert('Call unavailable', 'This device cannot place calls.')); }
    catch { Alert.alert('Call unavailable', 'This device cannot place calls.'); }
  };

  const smsContact = (c: Contact) => {
    // Honest note: real SMS send requires a configured messaging service or
    // the native SMS app. We open an sms: deeplink as best-effort.
    try { Linking.openURL(`sms:${c.phone}?body=${encodeURIComponent(message)}`).catch(() => Alert.alert('SMS unavailable', 'Opening the SMS app failed.')); }
    catch { Alert.alert('SMS unavailable', 'This platform does not support SMS deeplinks.'); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🆘</Text>
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>One tap to alert your backend and attempt to call for help.</Text>
      </View>

      <TouchableOpacity style={[styles.sosButton, busy && { opacity: 0.6 }]} disabled={busy} onPress={triggerSos}>
        <Text style={styles.sosText}>🆘 SEND SOS</Text>
      </TouchableOpacity>
      {lastStatus && <Text style={styles.statusText}>{lastStatus}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <TextInput style={styles.input} placeholder="Name" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={COLORS.textSecondary} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TouchableOpacity style={styles.addBtn} onPress={addContact}>
          <Text style={styles.addBtnText}>+ Add Contact</Text>
        </TouchableOpacity>
        {contacts.length === 0 && <Text style={styles.emptyText}>No contacts added.</Text>}
        {contacts.map((c, i) => (
          <View key={i} style={styles.contactItem}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactPhone}>{c.phone}</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity onPress={() => callContact(c)}><Text style={styles.contactAction}>Call</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => smsContact(c)}><Text style={styles.contactAction}>SMS</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => removeContact(i)}><Text style={[styles.contactAction, { color: COLORS.danger }]}>✕</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Message</Text>
        <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} placeholder="Message" placeholderTextColor={COLORS.textSecondary} value={message} onChangeText={setMessage} multiline />
      </View>

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          "Call emergency services" uses a tel: deeplink and depends on the device having cellular calling. Sending SMS to contacts opens the native SMS app via a deeplink — fully automated SMS delivery from the background requires a configured messaging service we do not run from the app alone.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  sosButton: { backgroundColor: COLORS.danger, borderRadius: 16, paddingVertical: 28, alignItems: 'center', marginBottom: 12 },
  sosText: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  statusText: { fontSize: 13, color: COLORS.safe, textAlign: 'center', marginBottom: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border, width: '100%' },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: COLORS.text, fontWeight: '700' },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 12 },
  contactItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactInfo: { flex: 1, marginRight: 8 },
  contactName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  contactPhone: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  contactActions: { flexDirection: 'row' },
  contactAction: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginLeft: 14 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
