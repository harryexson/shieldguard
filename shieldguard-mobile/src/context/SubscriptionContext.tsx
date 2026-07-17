import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import {
  subscriptionApi,
  FeatureDef,
  Entitlements,
  PlanDef,
} from '../services/api';
import { getDeviceId } from '../services/device';

type Tier = 'free' | 'standard' | 'premium';

interface SubscriptionContextType {
  loading: boolean;
  tier: Tier;
  entitlements: Entitlements | null;
  features: FeatureDef[];
  plans: PlanDef[];
  // True when the feature is included in the current plan.
  hasFeature: (featureId: string) => boolean;
  // Opens the Stripe Checkout session for the given plan.
  subscribe: (plan: Tier) => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TIER_RANK: Record<Tier, number> = { free: 0, standard: 1, premium: 2 };

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [features, setFeatures] = useState<FeatureDef[]>([]);
  const [plans, setPlans] = useState<PlanDef[]>([]);

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

  const tier: Tier = entitlements?.tier ?? 'free';

  return (
    <SubscriptionContext.Provider
      value={{ loading, tier, entitlements, features, plans, hasFeature, subscribe, refresh: load }}
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
