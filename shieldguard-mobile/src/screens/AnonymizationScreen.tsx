import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch } from 'react-native';
import { COLORS } from '../constants';
import { StatusCard, ThreatBadge } from '../components/StatusCard';

const TRACKERS_DATABASE = [
  { id: '1', domain: 'google-analytics.com', category: 'Analytics', blocked: true },
  { id: '2', domain: 'facebook.com/tr', category: 'Social Tracking', blocked: true },
  { id: '3', domain: 'doubleclick.net', category: 'Advertising', blocked: true },
  { id: '4', domain: 'crashlytics.com', category: 'Analytics', blocked: false },
  { id: '5', domain: 'adjust.com', category: 'Attribution', blocked: true },
  { id: '6', domain: 'appsflyer.com', category: 'Attribution', blocked: true },
  { id: '7', domain: 'mixpanel.com', category: 'Analytics', blocked: false },
  { id: '8', domain: 'hotjar.com', category: 'Analytics', blocked: true },
  { id: '9', domain: 'segment.io', category: 'Data Collection', blocked: false },
  { id: '10', domain: 'branch.io', category: 'Deep Linking', blocked: true },
];

export function AnonymizationScreen() {
  const [activeTab, setActiveTab] = useState('device');
  const [deviceAnonymization, setDeviceAnonymization] = useState({
    deviceIdHash: 'a7f3****-****-****-****-9b2c',
    macAddress: 'XX:XX:XX:XX:XX:XX',
    advertisingId: '0000-0000-0000-0000',
    serialNumber: 'SERIAL-XXXX',
    imei: 'XXXXX-XXXXXX-X',
    locationEnabled: true,
    status: 'protected',
  });

  const [metadata, setMetadata] = useState({
    stripGps: true,
    stripDevice: true,
    stripSoftware: true,
    stripColor: true,
    stripExif: true,
  });

  const [fingerprint, setFingerprint] = useState({
    canvasToken: 'canv_*******',
    audioToken: 'aud_*******',
    fontToken: 'fnt_*******',
    timezone: 'UTC+0',
    screen: '1080x2400',
    cores: '8',
    randomized: true,
  });

  const [trackingStats, setTrackingStats] = useState({
    trackersBlocked: 847,
    adsBlocked: 234,
    cookiesBlocked: 156,
    scriptsBlocked: 45,
  });

  const generateRandomMac = () => {
    const hexDigits = '0123456789ABCDEF';
    let mac = '';
    for (let i = 0; i < 6; i++) {
      mac += hexDigits[Math.floor(Math.random() * 16)];
      mac += hexDigits[Math.floor(Math.random() * 16)];
      if (i < 5) mac += ':';
    }
    return mac;
  };

  const rotateDeviceId = () => {
    const newId = Math.random().toString(36).substring(2, 15).toUpperCase();
    setDeviceAnonymization(prev => ({
      ...prev,
      deviceIdHash: newId.substring(0, 4) + '****-****-****-' + newId.substring(12),
    }));
  };

  const renderDeviceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statusCard}>
        <Text style={styles.statusIcon}>🛡️</Text>
        <Text style={styles.statusTitle}>Device Protected</Text>
        <Text style={styles.statusSubtitle}>Your device identity is being masked</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Device Identifiers</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device ID</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>{deviceAnonymization.deviceIdHash}</Text>
            <TouchableOpacity onPress={rotateDeviceId} style={styles.rotateButton}>
              <Text style={styles.rotateText}>🔄 Rotate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>MAC Address</Text>
          <Text style={styles.infoValue}>{generateRandomMac()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Advertising ID</Text>
          <Text style={styles.infoValue}>{deviceAnonymization.advertisingId}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Serial Number</Text>
          <Text style={styles.infoValue}>{deviceAnonymization.serialNumber}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>IMEI</Text>
          <Text style={styles.infoValue}>{deviceAnonymization.imei}</Text>
        </View>
      </View>

      <View style={styles.toggleSection}>
        <Text style={styles.sectionTitle}>Anonymization Controls</Text>
        
        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>📱 Device ID Masking</Text>
            <Text style={styles.toggleSubtitle}>Rotate advertising identifier</Text>
          </View>
          <Switch value={true} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>📡 MAC Spoofing</Text>
            <Text style={styles.toggleSubtitle}>Randomize network ID</Text>
          </View>
          <Switch value={true} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>📍 Location Masking</Text>
            <Text style={styles.toggleSubtitle}>Randomize GPS data</Text>
          </View>
          <Switch value={deviceAnonymization.locationEnabled} onValueChange={(v) => setDeviceAnonymization(p => ({...p, locationEnabled: v}))} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🔢 IMEI Masking</Text>
            <Text style={styles.toggleSubtitle}>Hide device identifier</Text>
          </View>
          <Switch value={true} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>
      </View>
    </View>
  );

  const renderMetadataTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statusCard}>
        <Text style={styles.statusIcon}>🖼️</Text>
        <Text style={styles.statusTitle}>Metadata Protected</Text>
        <Text style={styles.statusSubtitle}>EXIF and file metadata will be stripped</Text>
      </View>

      <View style={styles.toggleSection}>
        <Text style={styles.sectionTitle}>Metadata Stripping</Text>
        
        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>📍 GPS Coordinates</Text>
            <Text style={styles.toggleSubtitle}>Remove location from images</Text>
          </View>
          <Switch value={metadata.stripGps} onValueChange={(v) => setMetadata(p => ({...p, stripGps: v}))} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>📱 Device Info</Text>
            <Text style={styles.toggleSubtitle}>Remove phone model, software</Text>
          </View>
          <Switch value={metadata.stripDevice} onValueChange={(v) => setMetadata(p => ({...p, stripDevice: v}))} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>💻 Software Info</Text>
            <Text style={styles.toggleSubtitle}>Remove app versions, OS</Text>
          </View>
          <Switch value={metadata.stripSoftware} onValueChange={(v) => setMetadata(p => ({...p, stripSoftware: v}))} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🎨 Color Profile</Text>
            <Text style={styles.toggleSubtitle}>Remove color space data</Text>
          </View>
          <Switch value={metadata.stripColor} onValueChange={(v) => setMetadata(p => ({...p, stripColor: v}))} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>📷 EXIF Data</Text>
            <Text style={styles.toggleSubtitle}>Remove camera settings</Text>
          </View>
          <Switch value={metadata.stripExif} onValueChange={(v) => setMetadata(p => ({...p, stripExif: v}))} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>
      </View>

      <View style={styles.exampleSection}>
        <Text style={styles.sectionTitle}>What Gets Removed</Text>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleItem}>❌ GPS coordinates (latitude, longitude)</Text>
          <Text style={styles.exampleItem}>❌ Timestamp (when photo taken)</Text>
          <Text style={styles.exampleItem}>❌ Device make/model</Text>
          <Text style={styles.exampleItem}>❌ Software version</Text>
          <Text style={styles.exampleItem}>❌ Camera settings (ISO, aperture)</Text>
          <Text style={styles.exampleItem}>❌ Orientation/rotation</Text>
        </View>
      </View>
    </View>
  );

  const renderFingerprintTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statusCard}>
        <Text style={styles.statusIcon}>🔀</Text>
        <Text style={styles.statusTitle}>Fingerprints Randomized</Text>
        <Text style={styles.statusSubtitle}>Your digital fingerprint varies each session</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Fingerprint Tokens</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Canvas Hash</Text>
          <Text style={styles.infoValue}>{fingerprint.canvasToken}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Audio Hash</Text>
          <Text style={styles.infoValue}>{fingerprint.audioToken}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Font Fingerprint</Text>
          <Text style={styles.infoValue}>{fingerprint.fontToken}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Timezone</Text>
          <Text style={styles.infoValue}>{fingerprint.timezone}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatusCard title="Canvas" value="🔀" color={COLORS.safe} style={styles.statCard} />
        <StatusCard title="Audio" value="🔀" color={COLORS.safe} style={styles.statCard} />
        <StatusCard title="Fonts" value="🔀" color={COLORS.safe} style={styles.statCard} />
      </View>

      <View style={styles.toggleSection}>
        <Text style={styles.sectionTitle}>Randomization Controls</Text>
        
        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🎨 Canvas Randomization</Text>
            <Text style={styles.toggleSubtitle}>Vary canvas rendering</Text>
          </View>
          <Switch value={fingerprint.randomized} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🔊 Audio Context</Text>
            <Text style={styles.toggleSubtitle}>Randomize audio fingerprints</Text>
          </View>
          <Switch value={fingerprint.randomized} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🔤 Font Detection</Text>
            <Text style={styles.toggleSubtitle}>Mask available fonts</Text>
          </View>
          <Switch value={fingerprint.randomized} trackColor={{ false: COLORS.border, true: COLORS.safe + '80' }} thumbColor={COLORS.safe} />
        </View>
      </View>
    </View>
  );

  const renderTrackersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <StatusCard title="Trackers" value={trackingStats.trackersBlocked} color={COLORS.safe} style={styles.statCard} />
        <StatusCard title="Ads" value={trackingStats.adsBlocked} color={COLORS.warning} style={styles.statCard} />
      </View>

      <FlatList
        data={TRACKERS_DATABASE}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.trackerItem}>
            <View style={styles.trackerInfo}>
              <Text style={styles.trackerDomain}>{item.domain}</Text>
              <Text style={styles.trackerCategory}>{item.category}</Text>
            </View>
            <ThreatBadge level={item.blocked ? 'safe' : 'warning'} label={item.blocked ? 'Blocked' : 'Allowed'} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No trackers detected</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Anonymization</Text>
        <Text style={styles.subtitle}>Protect your identity and content</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'device' && styles.tabActive]} onPress={() => setActiveTab('device')}>
          <Text style={[styles.tabText, activeTab === 'device' && styles.tabTextActive]}>Device</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'metadata' && styles.tabActive]} onPress={() => setActiveTab('metadata')}>
          <Text style={[styles.tabText, activeTab === 'metadata' && styles.tabTextActive]}>Content</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'fingerprint' && styles.tabActive]} onPress={() => setActiveTab('fingerprint')}>
          <Text style={[styles.tabText, activeTab === 'fingerprint' && styles.tabTextActive]}>Fingerprint</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'trackers' && styles.tabActive]} onPress={() => setActiveTab('trackers')}>
          <Text style={[styles.tabText, activeTab === 'trackers' && styles.tabTextActive]}>Trackers</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'device' && renderDeviceTab()}
      {activeTab === 'metadata' && renderMetadataTab()}
      {activeTab === 'fingerprint' && renderFingerprintTab()}
      {activeTab === 'trackers' && renderTrackersTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { padding: 16, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginHorizontal: 2 },
  tabActive: { backgroundColor: COLORS.safe + '20' },
  tabText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.safe },
  tabContent: { flex: 1, paddingHorizontal: 16 },
  statusCard: { backgroundColor: COLORS.safe + '20', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.safe },
  statusIcon: { fontSize: 36, marginBottom: 8 },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statusSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  infoSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  infoRow: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoValueContainer: { flexDirection: 'row', alignItems: 'center' },
  infoValue: { fontSize: 12, color: COLORS.text, fontFamily: 'monospace' },
  rotateButton: { marginLeft: 12, padding: 4 },
  rotateText: { fontSize: 10, color: COLORS.safe },
  toggleSection: { marginBottom: 20 },
  toggleItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  toggleInfo: { flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  toggleSubtitle: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  statCard: { flex: 1, marginHorizontal: 4 },
  exampleSection: { marginBottom: 20 },
  exampleCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  exampleItem: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  trackerItem: { backgroundColor: COLORS.card, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  trackerInfo: { flex: 1 },
  trackerDomain: { fontSize: 12, color: COLORS.text },
  trackerCategory: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});