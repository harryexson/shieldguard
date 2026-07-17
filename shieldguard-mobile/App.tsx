import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

import { SecurityProvider } from './src/context/SecurityContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
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
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SecurityProvider>
      <SubscriptionProvider>
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
          </Stack.Navigator>
        </NavigationContainer>
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
