export interface Customer {
  id: string; name: string; email: string; company: string; plan: string; status: 'active' | 'trial' | 'canceled' | 'past_due';
  mrr: number; joinedAt: number; devices: number; threats: number; lastScan: number | null;
}

export interface Ticket {
  id: string; subject: string; customer: string; email: string; status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low'; category: string; assignee: string; createdAt: number; updatedAt: number;
}

export interface Invoice {
  id: string; customer: string; company: string; amount: number; status: 'paid' | 'pending' | 'overdue' | 'refunded';
  issuedAt: number; paidAt: number | null; plan: string;
}

export interface Subscription {
  id: string; customer: string; company: string; plan: string; status: 'active' | 'trial' | 'canceled' | 'past_due';
  mrr: number; startDate: number; nextBilling: number; devices: number;
}

export interface Transaction {
  id: string; description: string; amount: number; type: 'charge' | 'refund' | 'credit' | 'payout';
  status: 'completed' | 'pending' | 'failed'; createdAt: number; customer: string;
}

export interface Campaign {
  id: string; name: string; type: 'email' | 'social' | 'discount' | 'referral'; status: 'active' | 'draft' | 'completed' | 'paused';
  sent: number; opened: number; converted: number; budget: number; spent: number; startDate: number; endDate: number;
}

export interface Lead {
  id: string; name: string; company: string; email: string; phone: string; stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number; probability: number; source: string; owner: string; createdAt: number; lastContact: number;
}

export interface Promotion {
  id: string; code: string; type: 'percentage' | 'fixed' | 'trial_extension'; value: number; usageLimit: number; usageCount: number;
  status: 'active' | 'expired' | 'disabled'; startDate: number; endDate: number; minPlan: string;
}

export interface ThreatEvent {
  id: string; type: string; severity: 'critical' | 'high' | 'medium' | 'low'; deviceId: string; deviceName: string;
  userName: string; timestamp: number; status: 'blocked' | 'mitigated' | 'detected' | 'scanning';
}

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Acme Corp', email: 'admin@acmecorp.com', company: 'Acme Corp', plan: 'Enterprise', status: 'active', mrr: 4999, joinedAt: Date.now() - 300 * 86400000, devices: 247, threats: 1283, lastScan: Date.now() - 3600000 },
  { id: 'c2', name: 'GlobalTech Inc', email: 'it@globaltech.io', company: 'GlobalTech Inc', plan: 'Enterprise', status: 'active', mrr: 2999, joinedAt: Date.now() - 200 * 86400000, devices: 89, threats: 456, lastScan: Date.now() - 7200000 },
  { id: 'c3', name: 'Sarah Williams', email: 'sarah@email.com', company: 'Freelancer', plan: 'Pro', status: 'active', mrr: 29, joinedAt: Date.now() - 90 * 86400000, devices: 3, threats: 12, lastScan: Date.now() - 86400000 },
  { id: 'c4', name: 'Tom Bradley', email: 'tom@outlook.com', company: 'Individual', plan: 'Basic', status: 'active', mrr: 9, joinedAt: Date.now() - 60 * 86400000, devices: 1, threats: 5, lastScan: Date.now() - 172800000 },
  { id: 'c5', name: 'DataSecure Ltd', email: 'ops@datasecure.co', company: 'DataSecure Ltd', plan: 'Enterprise', status: 'trial', mrr: 0, joinedAt: Date.now() - 10 * 86400000, devices: 15, threats: 34, lastScan: null },
  { id: 'c6', name: 'StartupXYZ', email: 'founder@startupxyz.com', company: 'StartupXYZ', plan: 'Pro', status: 'active', mrr: 99, joinedAt: Date.now() - 45 * 86400000, devices: 12, threats: 67, lastScan: Date.now() - 43200000 },
  { id: 'c7', name: 'Emily Johnson', email: 'emily@gmail.com', company: 'Individual', plan: 'Basic', status: 'canceled', mrr: 0, joinedAt: Date.now() - 180 * 86400000, devices: 2, threats: 8, lastScan: Date.now() - 600 * 86400000 },
  { id: 'c8', name: 'MegaCorp International', email: 'security@megacorp.com', company: 'MegaCorp International', plan: 'Enterprise Plus', status: 'active', mrr: 9999, joinedAt: Date.now() - 365 * 86400000, devices: 512, threats: 3456, lastScan: Date.now() - 600000 },
];

export const TICKETS: Ticket[] = [
  { id: 't1', subject: 'False positive on internal app', customer: 'John CorpAdmin', email: 'john@acmecorp.com', status: 'open', priority: 'high', category: 'false_positive', assignee: 'Unassigned', createdAt: Date.now() - 3600000, updatedAt: Date.now() - 1800000 },
  { id: 't2', subject: 'Enterprise SSO integration issue', customer: 'Jane Ops', email: 'jane@globaltech.io', status: 'in_progress', priority: 'critical', category: 'integration', assignee: 'Mike Torres', createdAt: Date.now() - 7200000, updatedAt: Date.now() - 600000 },
  { id: 't3', subject: 'Need help with deployment', customer: 'Sarah Williams', email: 'sarah@email.com', status: 'open', priority: 'medium', category: 'deployment', assignee: 'Unassigned', createdAt: Date.now() - 14400000, updatedAt: Date.now() - 14400000 },
  { id: 't4', subject: 'Billing discrepancy on invoice INV-2024-0421', customer: 'Tom Bradley', email: 'tom@outlook.com', status: 'resolved', priority: 'low', category: 'billing', assignee: 'Mike Torres', createdAt: Date.now() - 86400000, updatedAt: Date.now() - 43200000 },
  { id: 't5', subject: 'Custom rule deployment request', customer: 'Alice IT', email: 'alice@acmecorp.com', status: 'open', priority: 'medium', category: 'configuration', assignee: 'Unassigned', createdAt: Date.now() - 10800000, updatedAt: Date.now() - 10800000 },
  { id: 't6', subject: 'Onboarding new department (50 devices)', customer: 'John CorpAdmin', email: 'john@acmecorp.com', status: 'in_progress', priority: 'high', category: 'onboarding', assignee: 'Mike Torres', createdAt: Date.now() - 172800000, updatedAt: Date.now() - 86400000 },
  { id: 't7', subject: 'API rate limit exceeded', customer: 'Dev Lead', email: 'dev@datasecure.co', status: 'open', priority: 'high', category: 'api', assignee: 'Unassigned', createdAt: Date.now() - 5400000, updatedAt: Date.now() - 5400000 },
  { id: 't8', subject: 'Report suspicious domain classification', customer: 'Emily Johnson', email: 'emily@gmail.com', status: 'closed', priority: 'low', category: 'report', assignee: 'Mike Torres', createdAt: Date.now() - 604800000, updatedAt: Date.now() - 518400000 },
];

export const INVOICES: Invoice[] = [
  { id: 'inv-001', customer: 'Acme Corp', company: 'Acme Corp', amount: 4999, status: 'paid', issuedAt: Date.now() - 30 * 86400000, paidAt: Date.now() - 28 * 86400000, plan: 'Enterprise' },
  { id: 'inv-002', customer: 'Acme Corp', company: 'Acme Corp', amount: 4999, status: 'pending', issuedAt: Date.now(), paidAt: null, plan: 'Enterprise' },
  { id: 'inv-003', customer: 'GlobalTech Inc', company: 'GlobalTech Inc', amount: 2999, status: 'paid', issuedAt: Date.now() - 30 * 86400000, paidAt: Date.now() - 25 * 86400000, plan: 'Enterprise' },
  { id: 'inv-004', customer: 'Sarah Williams', company: 'Freelancer', amount: 29, status: 'paid', issuedAt: Date.now() - 30 * 86400000, paidAt: Date.now() - 29 * 86400000, plan: 'Pro' },
  { id: 'inv-005', customer: 'Tom Bradley', company: 'Individual', amount: 9, status: 'overdue', issuedAt: Date.now() - 45 * 86400000, paidAt: null, plan: 'Basic' },
  { id: 'inv-006', customer: 'StartupXYZ', company: 'StartupXYZ', amount: 99, status: 'paid', issuedAt: Date.now() - 30 * 86400000, paidAt: Date.now() - 27 * 86400000, plan: 'Pro' },
  { id: 'inv-007', customer: 'MegaCorp International', company: 'MegaCorp International', amount: 9999, status: 'paid', issuedAt: Date.now() - 30 * 86400000, paidAt: Date.now() - 15 * 86400000, plan: 'Enterprise Plus' },
  { id: 'inv-008', customer: 'MegaCorp International', company: 'MegaCorp International', amount: 9999, status: 'paid', issuedAt: Date.now() - 60 * 86400000, paidAt: Date.now() - 45 * 86400000, plan: 'Enterprise Plus' },
];

export const SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-1', customer: 'Acme Corp', company: 'Acme Corp', plan: 'Enterprise', status: 'active', mrr: 4999, startDate: Date.now() - 300 * 86400000, nextBilling: Date.now() + 86400000, devices: 247 },
  { id: 'sub-2', customer: 'GlobalTech Inc', company: 'GlobalTech Inc', plan: 'Enterprise', status: 'active', mrr: 2999, startDate: Date.now() - 200 * 86400000, nextBilling: Date.now() + 5 * 86400000, devices: 89 },
  { id: 'sub-3', customer: 'DataSecure Ltd', company: 'DataSecure Ltd', plan: 'Enterprise', status: 'trial', mrr: 0, startDate: Date.now() - 10 * 86400000, nextBilling: Date.now() + 20 * 86400000, devices: 15 },
  { id: 'sub-4', customer: 'StartupXYZ', company: 'StartupXYZ', plan: 'Pro', status: 'active', mrr: 99, startDate: Date.now() - 45 * 86400000, nextBilling: Date.now() + 15 * 86400000, devices: 12 },
  { id: 'sub-5', customer: 'Sarah Williams', company: 'Freelancer', plan: 'Pro', status: 'active', mrr: 29, startDate: Date.now() - 90 * 86400000, nextBilling: Date.now() + 60 * 86400000, devices: 3 },
  { id: 'sub-6', customer: 'MegaCorp International', company: 'MegaCorp International', plan: 'Enterprise Plus', status: 'active', mrr: 9999, startDate: Date.now() - 365 * 86400000, nextBilling: Date.now() + 2 * 86400000, devices: 512 },
  { id: 'sub-7', customer: 'Tom Bradley', company: 'Individual', plan: 'Basic', status: 'past_due', mrr: 9, startDate: Date.now() - 60 * 86400000, nextBilling: Date.now(), devices: 1 },
];

export const TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', description: 'Enterprise subscription - Acme Corp', amount: 4999, type: 'charge', status: 'completed', createdAt: Date.now() - 86400000 * 2, customer: 'Acme Corp' },
  { id: 'tx-2', description: 'Enterprise Plus subscription - MegaCorp', amount: 9999, type: 'charge', status: 'completed', createdAt: Date.now() - 86400000 * 3, customer: 'MegaCorp International' },
  { id: 'tx-3', description: 'Pro subscription - StartupXYZ', amount: 99, type: 'charge', status: 'completed', createdAt: Date.now() - 86400000 * 5, customer: 'StartupXYZ' },
  { id: 'tx-4', description: 'Refund - Duplicate charge', amount: 29, type: 'refund', status: 'completed', createdAt: Date.now() - 86400000 * 7, customer: 'Sarah Williams' },
  { id: 'tx-5', description: 'Credit - Referral bonus', amount: 50, type: 'credit', status: 'completed', createdAt: Date.now() - 86400000 * 10, customer: 'Acme Corp' },
  { id: 'tx-6', description: 'Enterprise subscription - GlobalTech', amount: 2999, type: 'charge', status: 'completed', createdAt: Date.now() - 86400000 * 12, customer: 'GlobalTech Inc' },
  { id: 'tx-7', description: 'Basic subscription - Tom Bradley', amount: 9, type: 'charge', status: 'failed', createdAt: Date.now() - 86400000 * 14, customer: 'Tom Bradley' },
  { id: 'tx-8', description: 'Monthly payout - Referral program', amount: 1250, type: 'payout', status: 'completed', createdAt: Date.now() - 86400000 * 15, customer: 'System' },
];

export const CAMPAIGNS: Campaign[] = [
  { id: 'm1', name: 'Summer Security Sale', type: 'discount', status: 'active', sent: 50000, opened: 12500, converted: 2300, budget: 50000, spent: 12000, startDate: Date.now() - 15 * 86400000, endDate: Date.now() + 15 * 86400000 },
  { id: 'm2', name: 'Enterprise Q4 Outreach', type: 'email', status: 'active', sent: 2500, opened: 875, converted: 45, budget: 10000, spent: 3200, startDate: Date.now() - 7 * 86400000, endDate: Date.now() + 53 * 86400000 },
  { id: 'm3', name: 'Refer-a-Friend Program v2', type: 'referral', status: 'active', sent: 12000, opened: 4800, converted: 890, budget: 25000, spent: 8900, startDate: Date.now() - 30 * 86400000, endDate: Date.now() + 60 * 86400000 },
  { id: 'm4', name: 'LinkedIn Awareness Campaign', type: 'social', status: 'active', sent: 150000, opened: 22500, converted: 1200, budget: 75000, spent: 35000, startDate: Date.now() - 20 * 86400000, endDate: Date.now() + 10 * 86400000 },
  { id: 'm5', name: 'Back to School Promo', type: 'discount', status: 'completed', sent: 35000, opened: 8750, converted: 1800, budget: 30000, spent: 28500, startDate: Date.now() - 90 * 86400000, endDate: Date.now() - 60 * 86400000 },
  { id: 'm6', name: 'Product Launch Webinar', type: 'email', status: 'draft', sent: 0, opened: 0, converted: 0, budget: 5000, spent: 0, startDate: Date.now() + 14 * 86400000, endDate: Date.now() + 16 * 86400000 },
];

export const LEADS: Lead[] = [
  { id: 'l1', name: 'James Mitchell', company: 'FinSecure Bank', email: 'james@finsecure.com', phone: '+1 (555) 123-4567', stage: 'proposal', value: 35000, probability: 60, source: 'LinkedIn', owner: 'Jessica Park', createdAt: Date.now() - 30 * 86400000, lastContact: Date.now() - 86400000 },
  { id: 'l2', name: 'Anna Rodriguez', company: 'HealthData Inc', email: 'anna@healthdata.io', phone: '+1 (555) 234-5678', stage: 'qualified', value: 18000, probability: 40, source: 'Referral', owner: 'Jessica Park', createdAt: Date.now() - 20 * 86400000, lastContact: Date.now() - 172800000 },
  { id: 'l3', name: 'Robert Chen', company: 'EduTech Solutions', email: 'robert@edutech.com', phone: '+1 (555) 345-6789', stage: 'negotiation', value: 45000, probability: 75, source: 'Website', owner: 'Jessica Park', createdAt: Date.now() - 45 * 86400000, lastContact: Date.now() - 43200000 },
  { id: 'l4', name: 'Maria Santos', company: 'GovSecure Systems', email: 'maria@govsecure.gov', phone: '+1 (555) 456-7890', stage: 'new', value: 120000, probability: 20, source: 'Conference', owner: 'Jessica Park', createdAt: Date.now() - 5 * 86400000, lastContact: Date.now() - 86400000 },
  { id: 'l5', name: 'David Park', company: 'CloudNine Hosting', email: 'david@cloudnine.io', phone: '+1 (555) 567-8901', stage: 'won', value: 22000, probability: 100, source: 'Email Campaign', owner: 'Jessica Park', createdAt: Date.now() - 90 * 86400000, lastContact: Date.now() - 7 * 86400000 },
  { id: 'l6', name: 'Lisa Thompson', company: 'RetailMax Group', email: 'lisa@retailmax.com', phone: '+1 (555) 678-9012', stage: 'contacted', value: 8500, probability: 25, source: 'Website', owner: 'Jessica Park', createdAt: Date.now() - 12 * 86400000, lastContact: Date.now() - 3 * 86400000 },
  { id: 'l7', name: 'Kevin O\'Brien', company: 'LegalShield Partners', email: 'kevin@legalshield.com', phone: '+1 (555) 789-0123', stage: 'lost', value: 28000, probability: 0, source: 'Referral', owner: 'Jessica Park', createdAt: Date.now() - 120 * 86400000, lastContact: Date.now() - 90 * 86400000 },
  { id: 'l8', name: 'Jennifer Wu', company: 'MedCore Analytics', email: 'jennifer@medcore.com', phone: '+1 (555) 890-1234', stage: 'qualified', value: 55000, probability: 50, source: 'LinkedIn', owner: 'Jessica Park', createdAt: Date.now() - 18 * 86400000, lastContact: Date.now() - 3600000 },
];

export const PROMOTIONS: Promotion[] = [
  { id: 'p1', code: 'SUMMER25', type: 'percentage', value: 25, usageLimit: 500, usageCount: 234, status: 'active', startDate: Date.now() - 15 * 86400000, endDate: Date.now() + 15 * 86400000, minPlan: 'Pro' },
  { id: 'p2', code: 'ENTERPRISE10', type: 'fixed', value: 500, usageLimit: 50, usageCount: 12, status: 'active', startDate: Date.now() - 30 * 86400000, endDate: Date.now() + 30 * 86400000, minPlan: 'Enterprise' },
  { id: 'p3', code: 'WELCOME30', type: 'trial_extension', value: 30, usageLimit: 1000, usageCount: 567, status: 'active', startDate: Date.now() - 60 * 86400000, endDate: Date.now() + 120 * 86400000, minPlan: 'Basic' },
  { id: 'p4', code: 'BLACKFRIDAY', type: 'percentage', value: 40, usageLimit: 2000, usageCount: 1876, status: 'expired', startDate: Date.now() - 180 * 86400000, endDate: Date.now() - 150 * 86400000, minPlan: 'Basic' },
  { id: 'p5', code: 'PARTNER15', type: 'percentage', value: 15, usageLimit: 200, usageCount: 45, status: 'active', startDate: Date.now() - 45 * 86400000, endDate: Date.now() + 45 * 86400000, minPlan: 'Pro' },
];

export const THREAT_EVENTS: ThreatEvent[] = [
  { id: 'e1', type: 'Pegasus Spyware', severity: 'critical', deviceId: 'd001', deviceName: 'John\'s iPhone 15', userName: 'John CorpAdmin', timestamp: Date.now() - 1200000, status: 'blocked' },
  { id: 'e2', type: 'Phishing URL', severity: 'high', deviceId: 'd002', deviceName: 'Sarah\'s Pixel 8', userName: 'Sarah Williams', timestamp: Date.now() - 3600000, status: 'blocked' },
  { id: 'e3', type: 'Suspicious Domain', severity: 'medium', deviceId: 'd003', deviceName: 'Tom\'s Galaxy S24', userName: 'Tom Bradley', timestamp: Date.now() - 7200000, status: 'mitigated' },
  { id: 'e4', type: 'IMSI Catcher', severity: 'critical', deviceId: 'd004', deviceName: 'Acme Corp - Device #142', userName: 'Acme Corp', timestamp: Date.now() - 14400000, status: 'blocked' },
  { id: 'e5', type: 'SMS Phishing', severity: 'high', deviceId: 'd005', deviceName: 'MegaCorp - CTO Phone', userName: 'MegaCorp International', timestamp: Date.now() - 18000000, status: 'mitigated' },
  { id: 'e6', type: 'Data Exfiltration Attempt', severity: 'critical', deviceId: 'd006', deviceName: 'GlobalTech - Server #23', userName: 'GlobalTech Inc', timestamp: Date.now() - 43200000, status: 'blocked' },
  { id: 'e7', type: 'Malicious SMS', severity: 'medium', deviceId: 'd007', deviceName: 'Chris\'s OnePlus 12', userName: 'Chris Individual', timestamp: Date.now() - 86400000, status: 'detected' },
  { id: 'e8', type: 'Stalkerware', severity: 'high', deviceId: 'd008', deviceName: 'Emily\'s iPhone 14', userName: 'Emily Johnson', timestamp: Date.now() - 172800000, status: 'mitigated' },
];

export const PLAN_TIERS = [
  { name: 'Basic', price: 9, mrr: 9, devices: 1, support: 'Email', features: ['Basic threat detection', 'Manual scan', 'Email alerts', 'Weekly reports'] },
  { name: 'Pro', price: 29, mrr: 29, devices: 5, support: 'Email + Chat', features: ['Advanced threat detection', 'Auto-scan', 'Real-time alerts', 'Anonymization tools', 'Daily reports', 'API access'] },
  { name: 'Pro+', price: 99, mrr: 99, devices: 25, support: 'Priority Email + Chat', features: ['All Pro features', 'Extended device coverage', 'Priority support', 'Custom rules', 'Team management'] },
  { name: 'Enterprise', price: 2999, mrr: 2999, devices: 100, support: '24/7 Dedicated', features: ['All Pro+ features', 'Dedicated account manager', 'Custom integrations', 'SSO/SAML', 'Advanced RBAC', 'SLA guarantee', 'On-prem option'] },
  { name: 'Enterprise Plus', price: 9999, mrr: 9999, devices: 500, support: '24/7 VIP Dedicated', features: ['All Enterprise features', 'Unlimited devices (up to 500)', 'Dedicated support team', 'Custom deployment', 'Training & onboarding', 'Quarterly business review', 'Early access to features'] },
];

export const ENTERPRISE_USERS = [
  { id: 'eu1', name: 'John Smith', email: 'john@acmecorp.com', role: 'enterprise_admin', department: 'IT Security', status: 'active', lastActive: Date.now() - 600000 },
  { id: 'eu2', name: 'Alice Wong', email: 'alice@acmecorp.com', role: 'enterprise_it_support', department: 'IT Support', status: 'active', lastActive: Date.now() - 1200000 },
  { id: 'eu3', name: 'Bob Johnson', email: 'bob@acmecorp.com', role: 'enterprise_user', department: 'Engineering', status: 'active', lastActive: Date.now() - 3600000 },
  { id: 'eu4', name: 'Carol Martinez', email: 'carol@acmecorp.com', role: 'enterprise_user', department: 'Marketing', status: 'active', lastActive: Date.now() - 7200000 },
  { id: 'eu5', name: 'Dave Lee', email: 'dave@acmecorp.com', role: 'enterprise_user', department: 'Sales', status: 'inactive', lastActive: Date.now() - 604800000 },
  { id: 'eu6', name: 'Eve Chen', email: 'eve@acmecorp.com', role: 'enterprise_user', department: 'HR', status: 'active', lastActive: Date.now() - 14400000 },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(ts);
}

export function formatDateShort(ts: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(ts);
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return formatDate(ts);
}
