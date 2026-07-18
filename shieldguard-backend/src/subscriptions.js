const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SUB_PATH = path.join(DATA_DIR, 'subscriptions.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  ensureDir();
  try {
    if (fs.existsSync(SUB_PATH)) return JSON.parse(fs.readFileSync(SUB_PATH, 'utf-8'));
  } catch (_) {
    /* corrupted — start fresh */
  }
  return {};
}

function save(db) {
  ensureDir();
  fs.writeFileSync(SUB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// deviceId -> { tier, plan, status, since }
function getSubscription(deviceId) {
  const db = load();
  return (
    db[deviceId] || {
      tier: 'free',
      plan: 'free',
      status: 'active',
      since: Date.now(),
    }
  );
}

function setSubscription(deviceId, tier, plan) {
  const db = load();
  db[deviceId] = { tier, plan, status: 'active', since: Date.now() };
  save(db);
  return db[deviceId];
}

// If the device belongs to a Family plan (as owner or active member) it inherits
// the family tier, which includes every premium feature across up to deviceLimit devices.
function getEntitlements(deviceId) {
  const { featuresForTier } = require('./features');
  const { getGroupForDevice, publicView } = require('./family');
  const group = getGroupForDevice(deviceId);
  if (group) {
    return {
      tier: 'family',
      plan: 'family',
      status: 'active',
      features: featuresForTier('family'),
      family: publicView(group, deviceId),
    };
  }
  const sub = getSubscription(deviceId);
  return {
    tier: sub.tier,
    plan: sub.plan,
    status: sub.status,
    features: featuresForTier(sub.tier),
  };
}

module.exports = { getSubscription, setSubscription, getEntitlements };
