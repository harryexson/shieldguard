'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from './rbac';

interface AuthUser extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonate: (user: User) => void;
}

const CREDENTIALS: AuthUser[] = [
  { id: '1', name: 'Admin (Developer)', email: 'admin@shieldguard.dev', password: 'ShieldGuard2024!', role: 'super_admin', createdAt: Date.now() - 365 * 86400000, lastLogin: Date.now(), status: 'active' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@shieldguard.com', password: 'sarah123', role: 'super_admin', createdAt: Date.now() - 365 * 86400000, lastLogin: Date.now(), status: 'active' },
  { id: '3', name: 'Mike Torres', email: 'mike@shieldguard.com', password: 'mike123', role: 'support_agent', createdAt: Date.now() - 180 * 86400000, lastLogin: Date.now() - 3600000, status: 'active' },
  { id: '4', name: 'Jessica Park', email: 'jessica@shieldguard.com', password: 'jessica123', role: 'sales_rep', createdAt: Date.now() - 90 * 86400000, lastLogin: Date.now() - 7200000, status: 'active' },
  { id: '5', name: 'David Kim', email: 'david@shieldguard.com', password: 'david123', role: 'marketing_manager', createdAt: Date.now() - 60 * 86400000, lastLogin: Date.now() - 86400000, status: 'active' },
  { id: '6', name: 'Lisa Wang', email: 'lisa@shieldguard.com', password: 'lisa123', role: 'accountant', createdAt: Date.now() - 120 * 86400000, lastLogin: Date.now() - 1800000, status: 'active' },
  { id: '7', name: 'John CorpAdmin', email: 'john@acmecorp.com', password: 'john123', role: 'enterprise_admin', organization: 'Acme Corp', createdAt: Date.now() - 200 * 86400000, lastLogin: Date.now() - 300000, status: 'active' },
  { id: '8', name: 'Alice IT', email: 'alice@acmecorp.com', password: 'alice123', role: 'enterprise_it_support', organization: 'Acme Corp', createdAt: Date.now() - 100 * 86400000, lastLogin: Date.now() - 600000, status: 'active' },
  { id: '9', name: 'Bob Employee', email: 'bob@acmecorp.com', password: 'bob123', role: 'enterprise_user', organization: 'Acme Corp', createdAt: Date.now() - 30 * 86400000, lastLogin: Date.now() - 900000, status: 'active' },
  { id: '10', name: 'Chris Individual', email: 'chris@gmail.com', password: 'chris123', role: 'individual_user', createdAt: Date.now() - 15 * 86400000, lastLogin: Date.now() - 1200000, status: 'active' },
];

function stripPassword(u: AuthUser): User {
  const { password: _, ...user } = u;
  return user;
}

const MOCK_USERS = CREDENTIALS.map(stripPassword);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const found = CREDENTIALS.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid credentials');
    setUser({ ...stripPassword(found), lastLogin: Date.now() });
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const impersonate = useCallback((targetUser: User) => {
    setUser(targetUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, impersonate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}

export { MOCK_USERS, CREDENTIALS };
