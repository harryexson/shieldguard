import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useVault } from '../context/VaultContext';
import { PinGate } from '../components/PinGate';
import { encryptJson } from '../services/crypto';
import { vaultApi } from '../services/api';

function CameraInner() {
  const { pin } = useVault();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const cameraRef = useRef<any>(null);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) {
      // Fallback: expo-image-picker launchCameraAsync
      try {
        const ImagePicker = require('expo-image-picker');
        const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
        if (res.canceled || !res.assets?.[0]) return;
        await saveBase64(res.assets[0].base64);
      } catch (e: any) {
        Alert.alert('Camera unavailable', 'Neither expo-camera nor expo-image-picker is installed.');
      }
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      await saveBase64(photo.base64);
    } catch (e: any) {
      Alert.alert('Capture failed', e?.message || 'Could not take photo.');
    }
  }, [pin]);

  const saveBase64 = useCallback(async (b64: string | undefined) => {
    if (!b64) { Alert.alert('No image', 'The camera did not return image data.'); return; }
    setBusy(true);
    try {
      const payload = encryptJson({ data: b64 }, pin!);
      const name = `Secure Photo ${new Date().toLocaleString()}`;
      await vaultApi.create({ folder: 'Hidden', kind: 'photo', name, mimeType: 'image/jpeg', payload });
      setStatus('Encrypted and stored in your Hidden vault folder. The image was never saved to the public gallery.');
      Alert.alert('Saved to vault', 'Photo encrypted on-device and added to the Hidden folder.');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Could not encrypt the photo.');
    } finally { setBusy(false); }
  }, [pin]);

  React.useEffect(() => {
    try { require('expo-camera'); } catch { setHasCamera(false); }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>📷</Text>
        <Text style={styles.title}>Secure Camera</Text>
        <Text style={styles.subtitle}>Photos are encrypted on-device and stored only in your vault.</Text>
      </View>

      {!hasCamera && (
        <View style={styles.missingCard}>
          <Text style={styles.missingText}>expo-camera not installed — tap capture to use the system camera via expo-image-picker. Run "npx expo install expo-camera" for in-app capture.</Text>
        </View>
      )}

      {hasCamera && (
        <View style={styles.preview}>
          <Text style={styles.previewText}>Camera preview requires a native CameraView mount.{'\n'}Tap "Capture" to take an encrypted photo.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} disabled={busy} onPress={takePhoto}>
        <Text style={styles.primaryButtonText}>{busy ? 'Encrypting…' : 'Capture Photo'}</Text>
      </TouchableOpacity>

      {status && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          The image is encrypted with your vault PIN before it leaves memory. It is never written to the device gallery or any shared album, and the server stores only ciphertext. If your vault PIN is lost, the photo cannot be recovered.
        </Text>
      </View>
    </ScrollView>
  );
}

export function SecureCameraScreen() {
  return (
    <PinGate title="Camera Locked" subtitle="Unlock your vault to capture encrypted photos.">
      <CameraInner />
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
  missingCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.warning + '40' },
  missingText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  preview: { backgroundColor: COLORS.card, borderRadius: 12, padding: 40, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  previewText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  statusCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.safe },
  statusText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
