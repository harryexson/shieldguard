import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useSubscription } from '../context/SubscriptionContext';
import { PlanDef } from '../services/api';
import { TIER_LABELS } from '@shieldguard/shared';

export function SubscriptionScreen() {
  const { tier, entitlements, plans, subscribe, subscribeFamily, loading } = useSubscription();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.safe} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.title}>Your Plan</Text>
      </View>

      <View style={styles.currentCard}>
        <Text style={styles.currentLabel}>Current plan</Text>
        <Text style={styles.currentValue}>{TIER_LABELS[tier]}</Text>
        {entitlements?.renewsAt ? (
          <Text style={styles.currentDetail}>
            Renews {new Date(entitlements.renewsAt).toLocaleDateString()}
          </Text>
        ) : (
          <Text style={styles.currentDetail}>
            {tier === 'free' ? 'Upgrade to unlock advanced protection' : 'Active subscription'}
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Plans</Text>
      {plans.map((plan: PlanDef) => {
        const isCurrent = plan.id === tier;
        const isFamily = plan.id === 'family';
        const handlePress = () => {
          if (isFamily) {
            subscribeFamily('family');
          } else {
            subscribe(plan.id as any);
          }
        };
        return (
          <View key={plan.id} style={[styles.planCard, plan.highlighted && styles.planCardHi, isFamily && styles.planCardFamily]}>
            <View style={styles.planHead}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>
                ${plan.priceMonthly}
                <Text style={styles.planPer}>/mo</Text>
              </Text>
            </View>
            {isFamily && (
              <View style={styles.deviceBadge}>
                <Text style={styles.deviceBadgeText}>🛡️ Covers up to 5 devices</Text>
              </View>
            )}
            <View style={styles.planFeatures}>
              {plan.features.map((f) => (
                <Text key={f} style={styles.planFeature}>• {f}</Text>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.planBtn, isCurrent && styles.planBtnDisabled]}
              disabled={isCurrent}
              onPress={handlePress}
            >
              <Text style={styles.planBtnText}>
                {isCurrent ? 'Current plan' : `Choose ${plan.name}`}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
      {plans.length === 0 && (
        <Text style={styles.note}>Plans unavailable — configure Stripe on the server to enable purchases.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  header: { alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  currentCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.safe + '50' },
  currentLabel: { fontSize: 12, color: COLORS.textSecondary },
  currentValue: { fontSize: 26, fontWeight: 'bold', color: COLORS.safe, marginTop: 4 },
  currentDetail: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  planCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  planCardHi: { borderColor: COLORS.safe, borderWidth: 2 },
  planCardFamily: { borderColor: COLORS.accent, borderWidth: 2 },
  deviceBadge: { backgroundColor: COLORS.accent + '18', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 10 },
  deviceBadgeText: { fontSize: 12, color: COLORS.safe, fontWeight: '600' },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  planPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.safe },
  planPer: { fontSize: 12, color: COLORS.textSecondary },
  planFeatures: { marginBottom: 12 },
  planFeature: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 3 },
  planBtn: { backgroundColor: COLORS.safe, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  planBtnDisabled: { backgroundColor: COLORS.border },
  planBtnText: { color: '#04121E', fontSize: 14, fontWeight: 'bold' },
  note: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 13, marginTop: 8 },
});
