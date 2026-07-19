'use strict';

// SQLite-backed subscription/entitlement store. Replaces the JSON file store.
// Keeps getSubscription, setSubscription, getEntitlements exports.

const { getDb } = require('./db');

function getSubscription(deviceId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM subscriptions WHERE device_id = ?').get(deviceId);
  if (row) return { tier: row.tier, plan: row.plan, status: row.status, since: row.since };
  return { tier: 'free', plan: 'free', status: 'active', since: Date.now() };
}

function setSubscription(deviceId, tier, plan) {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    `INSERT INTO subscriptions (device_id, tier, plan, status, since) VALUES (?, ?, ?, 'active', ?)
     ON CONFLICT(device_id) DO UPDATE SET tier=excluded.tier, plan=excluded.plan, status='active', since=excluded.since`
  ).run(deviceId, tier, plan, now);
  return { tier, plan, status: 'active', since: now };
}

function getEntitlements(deviceId) {
  const { featuresForTier } = require('@shieldguard/shared');
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
