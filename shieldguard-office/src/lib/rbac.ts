export type Role = 'super_admin' | 'support_agent' | 'sales_rep' | 'marketing_manager' | 'accountant' | 'enterprise_admin' | 'enterprise_it_support' | 'enterprise_user' | 'individual_user';

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

export interface Permission {
  action: string;
  resource: string;
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  enterprise_admin: 80,
  accountant: 70,
  support_agent: 60,
  sales_rep: 50,
  marketing_manager: 50,
  enterprise_it_support: 40,
  enterprise_user: 20,
  individual_user: 10,
};

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    { action: '*', resource: '*' },
  ],
  support_agent: [
    { action: 'read', resource: 'tickets' },
    { action: 'write', resource: 'tickets' },
    { action: 'read', resource: 'users' },
    { action: 'read', resource: 'customers' },
    { action: 'write', resource: 'customers' },
  ],
  sales_rep: [
    { action: 'read', resource: 'leads' },
    { action: 'write', resource: 'leads' },
    { action: 'read', resource: 'customers' },
    { action: 'write', resource: 'customers' },
    { action: 'read', resource: 'pipeline' },
    { action: 'write', resource: 'pipeline' },
    { action: 'read', resource: 'pitch_deck' },
    { action: 'read', resource: 'investor_deck' },
  ],
  marketing_manager: [
    { action: 'read', resource: 'campaigns' },
    { action: 'write', resource: 'campaigns' },
    { action: 'read', resource: 'promotions' },
    { action: 'write', resource: 'promotions' },
    { action: 'read', resource: 'customers' },
    { action: 'read', resource: 'analytics' },
  ],
  accountant: [
    { action: 'read', resource: 'invoices' },
    { action: 'write', resource: 'invoices' },
    { action: 'read', resource: 'transactions' },
    { action: 'read', resource: 'subscriptions' },
    { action: 'write', resource: 'subscriptions' },
    { action: 'read', resource: 'reports' },
    { action: 'read', resource: 'billing' },
    { action: 'write', resource: 'billing' },
  ],
  enterprise_admin: [
    { action: 'read', resource: 'dashboard' },
    { action: 'read', resource: 'threats' },
    { action: 'read', resource: 'scan' },
    { action: 'write', resource: 'scan' },
    { action: 'read', resource: 'users' },
    { action: 'write', resource: 'users' },
    { action: 'read', resource: 'enterprise_settings' },
    { action: 'write', resource: 'enterprise_settings' },
    { action: 'read', resource: 'billing' },
    { action: 'read', resource: 'reports' },
  ],
  enterprise_it_support: [
    { action: 'read', resource: 'dashboard' },
    { action: 'read', resource: 'threats' },
    { action: 'read', resource: 'scan' },
    { action: 'write', resource: 'scan' },
    { action: 'read', resource: 'users' },
    { action: 'read', resource: 'tickets' },
    { action: 'write', resource: 'tickets' },
  ],
  enterprise_user: [
    { action: 'read', resource: 'dashboard' },
    { action: 'read', resource: 'threats' },
    { action: 'read', resource: 'scan' },
    { action: 'write', resource: 'scan' },
  ],
  individual_user: [
    { action: 'read', resource: 'dashboard' },
    { action: 'read', resource: 'threats' },
    { action: 'read', resource: 'scan' },
    { action: 'write', resource: 'scan' },
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  support_agent: 'Support Agent',
  sales_rep: 'Sales Representative',
  marketing_manager: 'Marketing Manager',
  accountant: 'Accountant',
  enterprise_admin: 'Enterprise Admin',
  enterprise_it_support: 'Enterprise IT Support',
  enterprise_user: 'Enterprise User',
  individual_user: 'Individual User',
};

export const SIDEBAR_ITEMS: Record<string, { label: string; icon: string; href: string; roles: Role[] }[]> = {
  main: [
    { label: 'Dashboard', icon: '📊', href: '/dashboard', roles: ['super_admin', 'support_agent', 'sales_rep', 'marketing_manager', 'accountant', 'enterprise_admin', 'enterprise_it_support', 'enterprise_user', 'individual_user'] },
    { label: 'Scan Device', icon: '🔍', href: '/scan', roles: ['super_admin', 'enterprise_admin', 'enterprise_it_support', 'enterprise_user', 'individual_user'] },
  ],
  operations: [
    { label: 'CRM', icon: '👥', href: '/crm', roles: ['super_admin', 'sales_rep', 'support_agent'] },
    { label: 'Support', icon: '🎫', href: '/support', roles: ['super_admin', 'support_agent', 'enterprise_it_support'] },
    { label: 'Billing', icon: '💳', href: '/billing', roles: ['super_admin', 'accountant'] },
    { label: 'Accounting', icon: '💰', href: '/accounting', roles: ['super_admin', 'accountant'] },
    { label: 'Marketing', icon: '📢', href: '/marketing', roles: ['super_admin', 'marketing_manager'] },
    { label: 'Sales', icon: '📈', href: '/sales', roles: ['super_admin', 'sales_rep'] },
  ],
  enterprise: [
    { label: 'Enterprise', icon: '🏢', href: '/enterprise', roles: ['super_admin', 'enterprise_admin', 'enterprise_it_support'] },
    { label: 'Team Users', icon: '👤', href: '/enterprise/users', roles: ['super_admin', 'enterprise_admin'] },
  ],
  admin: [
    { label: 'User Admin', icon: '⚙️', href: '/admin/users', roles: ['super_admin'] },
    { label: 'Roles & Permissions', icon: '🔐', href: '/admin/roles', roles: ['super_admin'] },
  ],
};

export function hasPermission(user: User, action: string, resource: string): boolean {
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.some(p => (p.action === '*' || p.action === action) && (p.resource === '*' || p.resource === resource));
}

export function hasRole(user: User, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
}
