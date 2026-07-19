import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import {
  subscriptionApi,
  familyApi,
  FeatureDef,
  Entitlements,
  PlanDef,
  FamilyView,
} from '../services/api';
import { Tier, TIER_RANK } from '@shieldguard/shared';
import { getDeviceId } from '../services/device';

interface SubscriptionContextType {
  loading: boolean;
  tier: Tier;
  entitlements: Entitlements | null;
  features: FeatureDef[];
  plans: PlanDef[];
  // Family group view (present when the device is covered by a family plan).
  family: FamilyView | null;
  // True when the feature is included in the current plan.
  hasFeature: (featureId: string) => boolean;
  // Opens the Stripe Checkout session for the given plan.
  subscribe: (plan: Tier) => Promise<void>;
  // Activates a family plan: opens checkout, then creates the family group.
  subscribeFamily: (plan: 'family', name?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [features, setFeatures] = useState<FeatureDef[]>([]);
  const [plans, setPlans] = useState<PlanDef[]>([]);
  const [family, setFamily] = useState<FamilyView | null>(null);

  const load = useCallback(async () => {
    const deviceId = getDeviceId();
    try {
      const [ents, feats, pls] = await Promise.all([
        subscriptionApi.getEntitlements(),
        subscriptionApi.getFeatures(),
        subscriptionApi.getPlans().catch(() => [] as PlanDef[]),
      ]);
      setEntitlements(ents);
      setFeatures(feats);
      setPlans(pls);
      // Entitlements can include a `family` object when covered by a family
      // plan (owner or active member). Fall back to the family API so the
      // group is still reachable even before checkout entitlement syncs.
      const famFromEnts = (ents as Entitlements & { family?: FamilyView }).family ?? null;
      if (famFromEnts) {
        setFamily(famFromEnts);
      } else {
        const fam = await familyApi.get(deviceId).catch(() => null);
        setFamily(fam);
      }
    } catch (err) {
      console.warn('Subscription load failed (is the backend running?)', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasFeature = useCallback(
    (featureId: string): boolean => {
      if (!entitlements) return false;
      if (entitlements.features.includes(featureId)) return true;
      // Free tier always gets features explicitly marked free.
      const def = features.find((f) => f.id === featureId);
      return !!def && def.tier === 'free';
    },
    [entitlements, features]
  );

  const subscribe = useCallback(
    async (plan: Tier) => {
      if (plan === 'free') return;
      try {
        const { url } = await subscriptionApi.checkout(plan as 'standard' | 'premium');
        await Linking.openURL(url);
        // Poll for activation (webhook normally handles this; this is the
        // fallback for environments where webhooks are delayed).
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const ents = await subscriptionApi.getEntitlements();
          if (TIER_RANK[ents.tier] >= TIER_RANK[plan]) {
            setEntitlements(ents);
            return;
          }
        }
        await load();
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 503) {
          Alert.alert(
            'Checkout unavailable',
            'Stripe keys are not configured on the server yet. Add STRIPE_SECRET_KEY, STRIPE_PRICE_STANDARD and STRIPE_PRICE_PREMIUM to enable purchases.'
          );
        } else {
          Alert.alert('Subscription error', err?.message || 'Could not start checkout.');
        }
      }
    },
    [load]
  );

  // Family plan purchase: opens the Stripe checkout for the `family` price,
  // then (after activation) creates the family group. The backend also
  // auto-creates on checkout confirm; calling create is idempotent/safe.
  const subscribeFamily = useCallback(
    async (plan: 'family', name?: string) => {
      try {
        const { url } = await subscriptionApi.checkout(plan as 'standard' | 'premium');
        await Linking.openURL(url);
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const ents = await subscriptionApi.getEntitlements();
          if (ents.plan === 'family' || (ents as Entitlements & { family?: FamilyView }).family) {
            setEntitlements(ents);
            const created = await familyApi.create(getDeviceId(), name);
            setFamily(created);
            return;
          }
        }
        await load();
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 503) {
          Alert.alert(
            'Checkout unavailable',
            'Stripe keys are not configured on the server yet. Add the family price id and STRIPE_SECRET_KEY to enable purchases.'
          );
        } else {
          Alert.alert('Subscription error', err?.message || 'Could not start checkout.');
        }
      }
    },
    [load]
  );

  const tier: Tier = entitlements?.tier ?? 'free';

  return (
    <SubscriptionContext.Provider
      value={{ loading, tier, entitlements, features, plans, family, hasFeature, subscribe, subscribeFamily, refresh: load }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (ctx === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return ctx;
}
