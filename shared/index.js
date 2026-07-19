// @shieldguard/shared — the single source of truth for the ShieldGuard platform.
// Re-exports tiers, features, RBAC, brand tokens and API contracts so every app
// (backend, mobile, office, landing) imports from one place.

const tiers = require('./tiers');
const features = require('./features');
const rbac = require('./rbac');
const brand = require('./brand');
const api = require('./api');

module.exports = {
  ...tiers,
  ...features,
  ...rbac,
  ...brand,
  ...api,
};
