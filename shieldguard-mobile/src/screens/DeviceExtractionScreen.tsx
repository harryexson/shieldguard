import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../constants';

export function DeviceExtractionScreen() {
  const [pinLock, setPinLock] = useState(true);
  const [usbBlocking, setUsbBlocking] = useState(true);
  const [bootProtection, setBootProtection] = useState(true);
  const [memoryEncryption, setMemoryEncryption] = useState(true);
  const [extractionPin] = useState('****');

  const handleChangePin = () => {
    Alert.prompt
      ? Alert.prompt('Change Extraction PIN', 'Enter new 4-12 digit PIN', [{ text: 'Cancel', style: 'cancel' }, { text: 'Save' }])
      : Alert.alert('Change Extraction PIN', 'PIN management available in device settings');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Device Extraction Protection</Text>
        <Text style={styles.subtitle}>Prevent forensic data extraction with PIN-locked hardware defense</Text>
      </View>

      <View style={styles.pinCard}>
        <Text style={styles.pinLabel}>Extraction PIN</Text>
        <Text style={styles.pinValue}>{extractionPin}</Text>
        <Text style={styles.pinStatus}>Active - 10 failed attempts remaining</Text>
        <TouchableOpacity style={styles.pinButton} onPress={handleChangePin}>
          <Text style={styles.pinButtonText}>Change PIN</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Protection Features</Text>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Extraction Lock</Text>
            <Text style={styles.featureDesc}>PIN required before any data extraction is permitted</Text>
          </View>
          <Switch value={pinLock} onValueChange={setPinLock} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={pinLock ? COLORS.safe : COLORS.textSecondary} />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>USB Debugging Block</Text>
            <Text style={styles.featureDesc}>Disables USB debugging unless unlocked with PIN</Text>
          </View>
          <Switch value={usbBlocking} onValueChange={setUsbBlocking} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={usbBlocking ? COLORS.safe : COLORS.textSecondary} />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Boot Loader Protection</Text>
            <Text style={styles.featureDesc}>Prevents forensic boot into extraction mode</Text>
          </View>
          <Switch value={bootProtection} onValueChange={setBootProtection} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={bootProtection ? COLORS.safe : COLORS.textSecondary} />
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>Memory Encryption</Text>
            <Text style={styles.featureDesc}>Encrypts RAM to prevent cold boot attacks</Text>
          </View>
          <Switch value={memoryEncryption} onValueChange={setMemoryEncryption} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={memoryEncryption ? COLORS.safe : COLORS.textSecondary} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extraction Attempts</Text>
        <View style={styles.logItem}>
          <Text style={styles.logIcon}>✅</Text>
          <View>
            <Text style={styles.logTitle}>Authorized access</Text>
            <Text style={styles.logDesc}>USB connection via PIN authentication</Text>
          </View>
          <Text style={styles.logTime}>2h ago</Text>
        </View>
        <View style={styles.logItem}>
          <Text style={styles.logIcon}>🚫</Text>
          <View>
            <Text style={styles.logTitle}>Blocked: Forensic tool detected</Text>
            <Text style={styles.logDesc}>Extraction tool signature identified and blocked</Text>
          </View>
          <Text style={styles.logTime}>1d ago</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  pinCard: { backgroundColor: COLORS.warning + '20', borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.warning },
  pinLabel: { fontSize: 12, color: COLORS.textSecondary },
  pinValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginTop: 8, letterSpacing: 8 },
  pinStatus: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8 },
  pinButton: { backgroundColor: COLORS.warning, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, marginTop: 16 },
  pinButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  featureItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  featureInfo: { flex: 1, marginRight: 12 },
  featureName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  featureDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  logItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  logIcon: { fontSize: 18, marginRight: 12 },
  logTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  logDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  logTime: { fontSize: 10, color: COLORS.textSecondary, marginLeft: 'auto' },
});
