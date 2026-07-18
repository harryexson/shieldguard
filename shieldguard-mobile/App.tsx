import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { SecurityProvider } from './src/context/SecurityContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { VaultProvider } from './src/context/VaultContext';
import { PanicProvider } from './src/context/PanicContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { NetworkScreen } from './src/screens/NetworkScreen';
import { AuditScreen } from './src/screens/AuditScreen';
import { AnonymizationScreen } from './src/screens/AnonymizationScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { SMSSecurityScreen } from './src/screens/SMSSecurityScreen';
import { CellSignalScreen } from './src/screens/CellSignalScreen';
import { EmailSecurityScreen } from './src/screens/EmailSecurityScreen';
import { DeviceExtractionScreen } from './src/screens/DeviceExtractionScreen';
import { SocialVaultScreen } from './src/screens/SocialVaultScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { FamilyScreen } from './src/screens/FamilyScreen';
import { SecureVaultScreen } from './src/screens/SecureVaultScreen';
import { PanicLockScreen } from './src/screens/PanicLockScreen';
import { DuressPinScreen } from './src/screens/DuressPinScreen';
import { SecureNotesScreen } from './src/screens/SecureNotesScreen';
import { PasswordManagerScreen } from './src/screens/PasswordManagerScreen';
import { SecureShareScreen } from './src/screens/SecureShareScreen';
import { ThreatDashboardScreen } from './src/screens/ThreatDashboardScreen';
import { EmergencySOSScreen } from './src/screens/EmergencySOSScreen';
import { RootDetectionScreen } from './src/screens/RootDetectionScreen';
import { WifiSecurityScreen } from './src/screens/WifiSecurityScreen';
import { PermissionMonitorScreen } from './src/screens/PermissionMonitorScreen';
import { SecureCameraScreen } from './src/screens/SecureCameraScreen';
import { MetadataRemoverScreen } from './src/screens/MetadataRemoverScreen';
import { QrSecureShareScreen } from './src/screens/QrSecureShareScreen';
import { BackupRestoreScreen } from './src/screens/BackupRestoreScreen';
import { AiAdvisorScreen } from './src/screens/AiAdvisorScreen';
import { AiIncidentReportScreen } from './src/screens/AiIncidentReportScreen';
import { SecureMessagingScreen } from './src/screens/SecureMessagingScreen';
import { SecureCallScreen } from './src/screens/SecureCallScreen';
import { DeviceSyncScreen } from './src/screens/DeviceSyncScreen';
import { RemoteWipeScreen } from './src/screens/RemoteWipeScreen';
import { GeoReminderScreen } from './src/screens/GeoReminderScreen';
import { AuditLogScreen } from './src/screens/AuditLogScreen';
import { TeamAdminScreen } from './src/screens/TeamAdminScreen';
import { AiPrivacyCoachScreen } from './src/screens/AiPrivacyCoachScreen';
import { AiThreatExplainScreen } from './src/screens/AiThreatExplainScreen';
import { AiEmergencyAssistScreen } from './src/screens/AiEmergencyAssistScreen';
import { COLORS } from './src/constants';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocusedText]}>{icon}</Text>
    </View>
  );
}

function MainTabs() {
  const navigation = useNavigation();

  const triggerPanic = () => {
    Alert.alert('Panic Lock', 'Lock the vault and signal distress?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Panic Lock',
        style: 'destructive',
        onPress: () => navigation.navigate('PanicLock' as never),
      },
    ]);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🛡️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Network"
        component={NetworkScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🌐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Anonymize"
        component={AnonymizationScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Audit"
        component={AuditScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👨‍👩‍👦" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SecurityProvider>
      <SubscriptionProvider>
        <VaultProvider>
          <PanicProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="Alerts" component={AlertsScreen} />
                <Stack.Screen name="SMSSecurity" component={SMSSecurityScreen} />
                <Stack.Screen name="CellSignal" component={CellSignalScreen} />
                <Stack.Screen name="EmailSecurity" component={EmailSecurityScreen} />
                <Stack.Screen name="DeviceExtraction" component={DeviceExtractionScreen} />
                <Stack.Screen name="SocialVault" component={SocialVaultScreen} />
                <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                <Stack.Screen name="Family" component={FamilyScreen} />
                <Stack.Screen name="SecureVault" component={SecureVaultScreen} />
                <Stack.Screen name="PanicLock" component={PanicLockScreen} />
                <Stack.Screen name="DuressPin" component={DuressPinScreen} />
                <Stack.Screen name="SecureNotes" component={SecureNotesScreen} />
                <Stack.Screen name="PasswordManager" component={PasswordManagerScreen} />
                <Stack.Screen name="SecureShare" component={SecureShareScreen} />
                <Stack.Screen name="ThreatDashboard" component={ThreatDashboardScreen} />
                <Stack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
                <Stack.Screen name="RootDetection" component={RootDetectionScreen} />
                <Stack.Screen name="WifiSecurity" component={WifiSecurityScreen} />
                <Stack.Screen name="PermissionMonitor" component={PermissionMonitorScreen} />
                <Stack.Screen name="SecureCamera" component={SecureCameraScreen} />
                <Stack.Screen name="MetadataRemover" component={MetadataRemoverScreen} />
                <Stack.Screen name="QrSecureShare" component={QrSecureShareScreen} />
                <Stack.Screen name="BackupRestore" component={BackupRestoreScreen} />
                <Stack.Screen name="AiAdvisor" component={AiAdvisorScreen} />
                <Stack.Screen name="AiIncidentReport" component={AiIncidentReportScreen} />
                <Stack.Screen name="SecureMessaging" component={SecureMessagingScreen} />
                <Stack.Screen name="SecureCall" component={SecureCallScreen} />
                <Stack.Screen name="DeviceSync" component={DeviceSyncScreen} />
                <Stack.Screen name="RemoteWipe" component={RemoteWipeScreen} />
                <Stack.Screen name="GeoReminder" component={GeoReminderScreen} />
                <Stack.Screen name="AuditLog" component={AuditLogScreen} />
                <Stack.Screen name="TeamAdmin" component={TeamAdminScreen} />
                <Stack.Screen name="AiPrivacyCoach" component={AiPrivacyCoachScreen} />
                <Stack.Screen name="AiThreatExplain" component={AiThreatExplainScreen} />
                <Stack.Screen name="AiEmergencyAssist" component={AiEmergencyAssistScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </PanicProvider>
        </VaultProvider>
      </SubscriptionProvider>
    </SecurityProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabIconFocused: {
    backgroundColor: COLORS.safe + '20',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconFocusedText: {
    opacity: 1,
  },
});
