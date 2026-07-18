import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants';
import { auditLog } from '../services/auditLog';

interface GeoReminder {
  id: string;
  label: string;
  note: string;
  lat: number;
  lng: number;
  radius: number;
}

const GEO_KEY = 'shieldguard_geo_reminders';

// Guarded expo-location access — module may not be installed; we never fail tsc
// on a missing module import (uses dynamic require inside try/catch).
function getLocationModule(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-location');
  } catch {
    return null;
  }
}

export function GeoReminderScreen() {
  const [reminders, setReminders] = useState<GeoReminder[]>([]);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('100');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(GEO_KEY);
      if (raw) setReminders(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (next: GeoReminder[]) => {
    setReminders(next);
    try {
      await AsyncStorage.setItem(GEO_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Best-effort: register a geofence if expo-location exposes the API.
  const registerGeofence = async (r: GeoReminder) => {
    const Location = getLocationModule();
    if (!Location || typeof Location.geofenceAsync !== 'function') return false;
    try {
      await Location.geofenceAsync(r.id, { latitude: r.lat, longitude: r.lng, radius: r.radius }, 'enter');
      return true;
    } catch {
      return false;
    }
  };

  const add = async () => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    const rad = parseFloat(radius);
    if (!label.trim() || isNaN(la) || isNaN(ln) || isNaN(rad)) {
      Alert.alert('Add reminder', 'Provide a label, valid coordinates, and a radius (meters).');
      return;
    }
    const r: GeoReminder = { id: `geo_${Date.now()}`, label: label.trim(), note: note.trim(), lat: la, lng: ln, radius: rad };
    const next = [...reminders, r];
    await save(next);
    setLabel('');
    setNote('');
    setLat('');
    setLng('');
    setRadius('100');
    await auditLog.add('geo_reminder_added');
    const ok = await registerGeofence(r);
    if (!ok) {
      Alert.alert('Reminder saved', 'Saved locally. Geofence OS registration is best-effort and may not be active on this device.');
    }
  };

  const remove = (id: string) => save(reminders.filter((r) => r.id !== id));

  // While the app is foreground/active, do a coarse inside-zone check so the
  // reminder fires even if native geofencing is unavailable.
  useEffect(() => {
    const check = async () => {
      if (reminders.length === 0) return;
      const Location = getLocationModule();
      if (!Location || typeof Location.getCurrentPositionAsync !== 'function') return;
      try {
        const pos = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = pos.coords;
        for (const r of reminders) {
          const d = Math.hypot((latitude - r.lat) * 111000, (longitude - r.lng) * 111000);
          if (d <= r.radius) {
            Alert.alert(r.label, r.note || 'You are in the geofenced area.');
          }
        }
      } catch {
        // permission denied / unavailable — skip
      }
    };
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, [reminders]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Geofenced Reminders</Text>
        <Text style={styles.subtitle}>Get a reminder when you enter a place (for this app).</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New reminder</Text>
        <TextInput style={styles.input} placeholder="Label (e.g. Home)" placeholderTextColor={COLORS.textSecondary} value={label} onChangeText={setLabel} />
        <TextInput style={styles.input} placeholder="Note" placeholderTextColor={COLORS.textSecondary} value={note} onChangeText={setNote} />
        <TextInput style={styles.input} placeholder="Latitude" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" value={lat} onChangeText={setLat} />
        <TextInput style={styles.input} placeholder="Longitude" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" value={lng} onChangeText={setLng} />
        <TextInput style={styles.input} placeholder="Radius (meters)" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" value={radius} onChangeText={setRadius} />
        <TouchableOpacity style={styles.btn} onPress={add}>
          <Text style={styles.btnText}>Add reminder</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Reminders</Text>
      {reminders.length === 0 && <Text style={styles.empty}>No reminders yet.</Text>}
      {reminders.map((r) => (
        <View key={r.id} style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{r.label}</Text>
            <Text style={styles.sub}>{r.note || '—'}</Text>
            <Text style={styles.coord}>{r.lat}, {r.lng} • {r.radius}m</Text>
          </View>
          <TouchableOpacity style={styles.removeBtn} onPress={() => remove(r.id)}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.honest}>
        <Text style={styles.honestText}>
          Reminders are for THIS app and its local notifications/alerts. This does NOT spoof or alter your real GPS location, and OS-level geofence delivery is best-effort.
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
  row: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  coord: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  removeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.danger + '20', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: COLORS.danger, fontSize: 14, fontWeight: 'bold' },
  honest: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.warning + '40' },
  honestText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
