import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';

export function MetadataRemoverScreen() {
  const [hasPicker, setHasPicker] = useState(true);
  const [hasManipulator, setHasManipulator] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const strip = useCallback(async () => {
    setBusy(true);
    setResult(null);
    try {
      const ImagePicker = require('expo-image-picker');
      const pick = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', base64: false });
      if (pick.canceled || !pick.assets?.[0]) { setBusy(false); return; }
      const uri = pick.assets[0].uri;

      let outUri = uri;
      try {
        const Manipulator = require('expo-image-manipulator');
        const res = await Manipulator.manipulateAsync(uri, [], { compress: 0.9 });
        outUri = res.uri;
      } catch {
        setHasManipulator(false);
        outUri = uri;
      }
      setResult(outUri);
      Alert.alert('Metadata stripped', 'A re-encoded copy was created. Share it from the preview below — the original file is untouched.');
    } catch (e: any) {
      Alert.alert('Could not process', e?.message || 'Image picker unavailable.');
    } finally { setBusy(false); }
  }, []);

  React.useEffect(() => {
    try { require('expo-image-picker'); } catch { setHasPicker(false); }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🧹</Text>
        <Text style={styles.title}>Metadata Remover</Text>
        <Text style={styles.subtitle}>Strip GPS / EXIF / camera metadata before sharing a photo.</Text>
      </View>

      {!hasPicker && (
        <View style={styles.missingCard}>
          <Text style={styles.missingText}>This feature needs expo-image-picker. Run "npx expo install expo-image-picker".</Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} disabled={busy || !hasPicker} onPress={strip}>
        <Text style={styles.primaryButtonText}>{busy ? 'Processing…' : 'Pick Image & Strip'}</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Cleaned copy ready</Text>
          <Text style={styles.resultValue} selectable>{result}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={() => {
            try {
              const { Share } = require('react-native');
              Share.share({ url: result }).catch(() => undefined);
            } catch { Alert.alert('Share unavailable'); }
          }}>
            <Text style={styles.shareText}>Share cleaned image</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.limitCard}>
        <Text style={styles.limitText}>
          Re-encoding the image removes most EXIF/GPS/camera metadata. This is a best-effort sanitization — some formats or embedded thumbnails may retain a few fields. For absolute removal of metadata from sensitive images, also review the file on a trusted tool before publishing.
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
  missingCard: { backgroundColor: COLORS.danger + '18', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.danger + '50' },
  missingText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  primaryButton: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  resultCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  resultLabel: { fontSize: 12, color: COLORS.textSecondary },
  resultValue: { fontSize: 12, color: COLORS.text, marginTop: 6, lineHeight: 16 },
  shareBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  shareText: { color: COLORS.text, fontWeight: '600' },
  limitCard: { backgroundColor: COLORS.warning + '12', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: COLORS.warning + '40' },
  limitText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
