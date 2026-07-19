import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../constants';
import { useSubscription } from '../context/SubscriptionContext';
import { FeatureDef, PlanDef } from '../services/api';
import { TIER_LABELS } from '@shieldguard/shared';

// Inline paywall shown when a feature is locked. Lists the available plans
// and lets the user start a Stripe Checkout session.
export function Paywall({ feature }: { feature?: FeatureDef }) {
  const { plans, subscribe, tier } = useSubscription();

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Text style={styles.lockIcon}>🔒</Text>
      </View>
      <Text style={styles.title}>
        {feature ? `${feature.name} is a paid feature` : 'Upgrade to unlock'}
      </Text>
      <Text style={styles.sub}>
        {feature
          ? `Requires the ${TIER_LABELS[feature.tier]} plan or higher.`
          : 'Choose a plan to activate advanced protection.'}
      </Text>

      <ScrollView style={styles.plans} contentContainerStyle={styles.plansContent}>
        {plans.map((plan: PlanDef) => {
          const isCurrent = plan.id === tier;
          return (
            <View key={plan.id} style={[styles.planCard, plan.highlighted && styles.planCardHi]}>
              <View style={styles.planHead}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>
                  ${plan.priceMonthly}
                  <Text style={styles.planPer}>/mo</Text>
                </Text>
              </View>
              <View style={styles.planFeatures}>
                {plan.features.slice(0, 4).map((f) => (
                  <Text key={f} style={styles.planFeature}>• {f}</Text>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.planBtn, isCurrent && styles.planBtnDisabled]}
                disabled={isCurrent}
                onPress={() => subscribe(plan.id as any)}
              >
                <Text style={styles.planBtnText}>
                  {isCurrent ? 'Current plan' : `Choose ${plan.name}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
        {plans.length === 0 && (
          <Text style={styles.noPlans}>Plans unavailable — configure Stripe on the server.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// Wraps screen content. Renders children when the device's plan includes the
// feature; otherwise renders the Paywall.
export function FeatureGate({
  feature,
  children,
}: {
  feature: string;
  children: React.ReactNode;
}) {
  const { hasFeature, features } = useSubscription();
  const def = features.find((f) => f.id === feature);

  if (hasFeature(feature)) return <>{children}</>;

  return <Paywall feature={def} />;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconWrap: { marginBottom: 12 },
  lockIcon: { fontSize: 44 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  sub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  plans: { width: '100%' },
  plansContent: { paddingBottom: 24, width: '100%' },
  planCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  planCardHi: { borderColor: COLORS.safe, borderWidth: 2 },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  planPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.safe },
  planPer: { fontSize: 12, color: COLORS.textSecondary },
  planFeatures: { marginBottom: 12 },
  planFeature: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 3 },
  planBtn: {
    backgroundColor: COLORS.safe,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planBtnDisabled: { backgroundColor: COLORS.border },
  planBtnText: { color: '#04121E', fontSize: 14, fontWeight: 'bold' },
  noPlans: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 13, marginTop: 8 },
});
