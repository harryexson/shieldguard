// Canonical roles & permissions — single source of truth for the whole platform.
// The office app, the backend entitlement checks, and the mobile app all read
// from here so a role or permission change propagates everywhere.

// Platform (office) roles, ordered highest privilege first.
const ROLES = [
  'super_admin',
  'support_agent',
  'sales_rep',
  'marketing_manager',
  'accountant',
  'enterprise_admin',
  'enterprise_it_support',
  'enterprise_user',
  'individual_user',
];

const ROLE_HIERARCHY = {
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

const ROLE_PERMISSIONS = {
  super_admin: [{ action: '*', resource: '*' }],
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

const ROLE_LABELS = {
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

const SIDEBAR_ITEMS = {
  main: [
    { label: 'Dashboard', icon: '📊', href: '/dashboard', roles: ROLES },
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
    { label: 'Families', icon: '👨‍👩‍👧‍👦', href: '/admin/families', roles: ['super_admin'] },
    { label: 'Incident Logs', icon: '🚨', href: '/admin/incidents', roles: ['super_admin'] },
    { label: 'Threat Dashboard', icon: '🛡️', href: '/admin/threat-dashboard', roles: ['super_admin'] },
    { label: 'AI Reports', icon: '🤖', href: '/admin/ai-reports', roles: ['super_admin'] },
    { label: 'Teams', icon: '👥', href: '/admin/teams', roles: ['super_admin'] },
    { label: 'Audit Trail', icon: '🧾', href: '/admin/audit', roles: ['super_admin'] },
  ],
};

// Device / app-level roles returned by the backend for family & enterprise plans.
const FAMILY_ROLES = ['owner', 'member'];
const DEVICE_ROLES = ['owner', 'member', 'enterprise_admin', 'enterprise_it_support', 'enterprise_user'];

function hasPermission(user, action, resource) {
  const permissions = (user && ROLE_PERMISSIONS[user.role]) || [];
  return permissions.some(
    (p) => (p.action === '*' || p.action === action) && (p.resource === '*' || p.resource === resource)
  );
}

function hasRole(user, requiredRole) {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
}

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  SIDEBAR_ITEMS,
  FAMILY_ROLES,
  DEVICE_ROLES,
  hasPermission,
  hasRole,
};
