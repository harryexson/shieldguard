import crypto from 'crypto';
import type { User, Role } from './rbac';

/**
 * DEMO-ONLY credential store.
 *
 * These users exist so the office app can be demoed without a real identity
 * provider. Passwords are NOT stored in plaintext: they are hashed with
 * SHA-256 at module load. This is NOT production-grade (use bcrypt/argon2
 * + a real IdP in production) — it only removes plaintext secrets from source.
 */

export interface DemoUser extends User {
  passwordHash: string;
}

const DEMO_PASSWORD_SUFFIX = '123';

function hashPassword(plain: string): string {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

function demoPasswordFor(name: string): string {
  const local = name.split(' ')[0].toLowerCase();
  return `${local}${DEMO_PASSWORD_SUFFIX}`;
}

interface SeedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization?: string;
  ageDays: number;
  lastLoginAgo: number;
}

const SEED: SeedUser[] = [
  { id: '1', name: 'Admin (Developer)', email: 'admin@shieldguard.dev', role: 'super_admin', ageDays: 365, lastLoginAgo: 0 },
  { id: '2', name: 'Sarah Chen', email: 'sarah@shieldguard.com', role: 'super_admin', ageDays: 365, lastLoginAgo: 3600000 },
  { id: '3', name: 'Mike Torres', email: 'mike@shieldguard.com', role: 'support_agent', ageDays: 180, lastLoginAgo: 3600000 },
  { id: '4', name: 'Jessica Park', email: 'jessica@shieldguard.com', role: 'sales_rep', ageDays: 90, lastLoginAgo: 7200000 },
  { id: '5', name: 'David Kim', email: 'david@shieldguard.com', role: 'marketing_manager', ageDays: 60, lastLoginAgo: 86400000 },
  { id: '6', name: 'Lisa Wang', email: 'lisa@shieldguard.com', role: 'accountant', ageDays: 120, lastLoginAgo: 1800000 },
  { id: '7', name: 'John CorpAdmin', email: 'john@acmecorp.com', role: 'enterprise_admin', organization: 'Acme Corp', ageDays: 200, lastLoginAgo: 300000 },
  { id: '8', name: 'Alice IT', email: 'alice@acmecorp.com', role: 'enterprise_it_support', organization: 'Acme Corp', ageDays: 100, lastLoginAgo: 600000 },
  { id: '9', name: 'Bob Employee', email: 'bob@acmecorp.com', role: 'enterprise_user', organization: 'Acme Corp', ageDays: 30, lastLoginAgo: 900000 },
  { id: '10', name: 'Chris Individual', email: 'chris@gmail.com', role: 'individual_user', ageDays: 15, lastLoginAgo: 1200000 },
];

export const DEMO_USERS: DemoUser[] = SEED.map((s) => {
  const user: User = {
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    organization: s.organization,
    createdAt: Date.now() - s.ageDays * 86400000,
    lastLogin: Date.now() - s.lastLoginAgo,
    status: 'active',
  };
  return { ...user, passwordHash: hashPassword(demoPasswordFor(s.name)) };
});

export const DEMO_PASSWORD_HINT = `The demo password for every user is the lowercased first name followed by "${DEMO_PASSWORD_SUFFIX}" (e.g. admin -> "admin123").`;

export interface QuickLogin {
  id: string;
  name: string;
  email: string;
  demoPassword: string;
}

export const DEMO_QUICK_LOGINS: QuickLogin[] = DEMO_USERS.slice(0, 4).map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  demoPassword: demoPasswordFor(u.name),
}));

export function findUserByEmail(email: string): DemoUser | undefined {
  const normalized = email.trim().toLowerCase();
  return DEMO_USERS.find((u) => u.email.toLowerCase() === normalized);
}

export function verifyPassword(email: string, password: string): DemoUser | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  const attempt = hashPassword(password);
  if (!crypto.timingSafeEqual(Buffer.from(attempt), Buffer.from(user.passwordHash))) {
    return null;
  }
  return user;
}

export function stripPassword(u: DemoUser): User {
  const { passwordHash: _passwordHash, ...user } = u;
  return user;
}

export { demoPasswordFor, DEMO_PASSWORD_SUFFIX };
