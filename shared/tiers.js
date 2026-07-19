// Canonical subscription tiers — the single source of truth for the whole
// ShieldGuard platform. Backend, mobile, office and landing page all read from
// here so a tier change propagates everywhere.

const TIERS = [
  {
    id: 'free',
    label: 'Free',
    rank: 0,
    priceMonthly: 0,
    description: 'Core on-device protection at no cost.',
  },
  {
    id: 'standard',
    label: 'Standard',
    rank: 1,
    priceMonthly: 9.99,
    description: 'Advanced scanning, network monitoring and phishing defense.',
  },
  {
    id: 'premium',
    label: 'Premium',
    rank: 2,
    priceMonthly: 14.99,
    description: 'Encrypted vault, metadata stripping and identifier anonymization.',
  },
  {
    id: 'family',
    label: 'Family',
    rank: 3,
    priceMonthly: 19.99,
    deviceLimit: 5,
    description: 'Cover up to 5 devices on one plan — invite family members and protect their phones too.',
  },
];

const TIER_RANK = TIERS.reduce((acc, t) => {
  acc[t.id] = t.rank;
  return acc;
}, {});

const TIER_LABELS = TIERS.reduce((acc, t) => {
  acc[t.id] = t.label;
  return acc;
}, {});

function tierRank(tier) {
  return TIER_RANK[tier] != null ? TIER_RANK[tier] : 0;
}

// Returns the ids of every tier whose rank is <= the given rank (i.e. included).
function tiersUpTo(rank) {
  return TIERS.filter((t) => t.rank <= rank).map((t) => t.id);
}

module.exports = { TIERS, TIER_RANK, TIER_LABELS, tierRank, tiersUpTo };
