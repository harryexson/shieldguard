// Type declarations for @shieldguard/shared (authored in plain JS so it can be
// required by the CommonJS backend and imported by the TypeScript apps).
// These types are the shared contract between backend, mobile and office.

export type Tier = 'free' | 'standard' | 'premium' | 'family';

export interface TierDef {
  id: Tier;
  label: string;
  rank: number;
  priceMonthly: number;
  description: string;
  deviceLimit?: number;
}

export const TIERS: TierDef[];
export const TIER_RANK: Record<Tier, number>;
export const TIER_LABELS: Record<Tier, string>;
export function tierRank(tier: Tier): number;
export function tiersUpTo(rank: number): Tier[];

export type DeliveryTarget = 'backend' | 'mobile' | 'mobile+backend' | 'human';

export interface FeatureDef {
  id: string;
  name: string;
  tier: Tier;
  description: string;
  deliveredBy: DeliveryTarget;
}

export const FEATURES: FeatureDef[];
export function featuresForTier(tier: Tier): string[];
export function featureAllowed(featureId: string, tier: Tier): boolean;

export type Role =
  | 'super_admin'
  | 'support_agent'
  | 'sales_rep'
  | 'marketing_manager'
  | 'accountant'
  | 'enterprise_admin'
  | 'enterprise_it_support'
  | 'enterprise_user'
  | 'individual_user';

export interface Permission {
  action: string;
  resource: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization?: string;
  avatar?: string;
  createdAt: number;
  lastLogin: number;
  status: 'active' | 'inactive' | 'suspended';
}

export const ROLES: Role[];
export const ROLE_HIERARCHY: Record<Role, number>;
export const ROLE_PERMISSIONS: Record<Role, Permission[]>;
export const ROLE_LABELS: Record<Role, string>;
export const SIDEBAR_ITEMS: Record<string, { label: string; icon: string; href: string; roles: Role[] }[]>;
export const FAMILY_ROLES: ('owner' | 'member')[];
export const DEVICE_ROLES: ('owner' | 'member' | 'enterprise_admin' | 'enterprise_it_support' | 'enterprise_user')[];
export function hasPermission(user: User, action: string, resource: string): boolean;
export function hasRole(user: User, requiredRole: Role): boolean;

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  safe: string;
  warning: string;
  danger: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
  tabBar: string;
}

export interface Brand {
  name: string;
  tagline: string;
  description: string;
  colors: BrandColors;
  threat: { safe: string; warning: string; danger: string; critical: string };
  fonts: { body: string; heading: string };
}

export const BRAND: Brand;
export const COLORS: BrandColors & Brand['threat'];
export const THREAT_LEVELS: Brand['threat'];

export const API_BASE_PATH: string;
export const ENDPOINTS: {
  health: string;
  threats: string;
  threatFeed: string;
  threatCheck: (pkg: string) => string;
  networkCheck: (domain: string) => string;
  scan: string;
  scanHistory: string;
  alerts: string;
  settings: string;
  stats: string;
  features: string;
  me: (deviceId?: string) => string;
  billingPlans: string;
  familyAdmin: string;
  incidentsAdmin: string;
  threatDashboard: string;
  aiReportsAdmin: string;
  auditAdmin: string;
};

// ─── Shared subscription / entitlement contract (backend -> mobile & office) ───
export interface FamilyMember {
  deviceId?: string;
  name?: string;
  email?: string;
  phone?: string;
  isOwner?: boolean;
  isYou?: boolean;
  status?: string;
}

export interface FamilyView {
  id: string;
  name: string;
  ownerDeviceId?: string;
  role?: 'owner' | 'member';
  deviceCount: number;
  deviceLimit: number;
  inviteCode?: string;
  pendingInvites?: number;
  createdAt?: string;
  members?: FamilyMember[];
  devices?: FamilyMember[];
}

export interface PlanDef {
  id: string;
  name: string;
  priceMonthly: number;
  currency?: string;
  features: string[];
  highlighted?: boolean;
  description?: string;
}

export interface Entitlements {
  deviceId: string;
  tier: Tier;
  subscriptionId: string | null;
  status: 'active' | 'none' | 'canceled' | 'past_due';
  renewsAt: number | null;
  plan: Tier | null;
  features: string[];
  family?: FamilyView;
}
