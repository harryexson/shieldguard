// Canonical feature catalogue — single source of truth for the whole platform.
// Each feature declares the minimum tier required and where the work happens.
// Nothing here is a false claim — "deliveredBy" says where the work runs.
const { TIER_RANK, tierRank } = require('./tiers');

const FEATURES = [
  {
    id: 'app_scan',
    name: 'App Scanner',
    tier: 'free',
    description: 'Scan installed apps against known spyware, stalkerware and surveillance signatures.',
    deliveredBy: 'mobile+backend',
  },
  {
    id: 'threat_feed',
    name: 'Threat Intelligence Feed',
    tier: 'free',
    description: 'Browse the latest known threat signatures curated by ShieldGuard.',
    deliveredBy: 'backend',
  },
  {
    id: 'domain_reputation',
    name: 'Domain & IP Reputation',
    tier: 'free',
    description: 'Check any domain or IP against the surveillance/command-and-control blocklist.',
    deliveredBy: 'backend',
  },
  {
    id: 'permission_audit',
    name: 'Permission Audit',
    tier: 'standard',
    description: 'Review installed apps and flag dangerous permission combinations (camera, mic, location, SMS).',
    deliveredBy: 'mobile',
  },
  {
    id: 'network_monitor',
    name: 'Network Monitor',
    tier: 'standard',
    description: 'Inspect active connections and block those resolve to known malicious infrastructure.',
    deliveredBy: 'mobile+backend',
  },
  {
    id: 'sms_scan',
    name: 'SMS Phishing Scan',
    tier: 'standard',
    description: 'Heuristic detection of malicious / spoofed SMS and premium-rate scams.',
    deliveredBy: 'mobile+backend',
  },
  {
    id: 'email_scan',
    name: 'Email Phishing Scan',
    tier: 'standard',
    description: 'Heuristic detection of phishing email including sender spoofing and unsafe links.',
    deliveredBy: 'mobile+backend',
  },
  {
    id: 'photo_vault',
    name: 'Encrypted Photo Vault',
    tier: 'premium',
    description: 'Store photos with EXIF metadata stripped and encrypted at rest on the device.',
    deliveredBy: 'mobile',
  },
  {
    id: 'metadata_strip',
    name: 'Metadata Stripping',
    tier: 'premium',
    description: 'Remove GPS, timestamp and device metadata before sharing files.',
    deliveredBy: 'mobile',
  },
  {
    id: 'id_anonymize',
    name: 'Identifier Anonymization',
    tier: 'premium',
    description: 'Rotate advertising and device identifiers to reduce cross-app tracking.',
    deliveredBy: 'mobile',
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    tier: 'premium',
    description: 'Faster response times from the ShieldGuard team.',
    deliveredBy: 'human',
  },
  {
    id: 'family_sharing',
    name: 'Family Sharing',
    tier: 'family',
    description: 'Cover up to 5 devices on one plan — invite family members by email/code and protect their phones too.',
    deliveredBy: 'mobile+backend',
  },
];

function featuresForTier(tier) {
  const rank = tierRank(tier);
  return FEATURES.filter((f) => tierRank(f.tier) <= rank).map((f) => f.id);
}

function featureAllowed(featureId, tier) {
  const f = FEATURES.find((x) => x.id === featureId);
  if (!f) return false;
  return tierRank(tier) >= tierRank(f.tier);
}

module.exports = { FEATURES, featuresForTier, featureAllowed, TIER_RANK };
