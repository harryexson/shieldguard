// Creates (or reuses) Stripe products + monthly prices for the ShieldGuard
// tiers and writes the resulting Price IDs into .env.
//
//   node scripts/setup-stripe-prices.js
//
// Idempotent: re-running reuses an existing product/price when the name and
// amount match, otherwise it creates a new one and updates .env.
//
// Requires STRIPE_SECRET_KEY to be set in .env (or the environment).

const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

// Minimal .env reader so we don't depend on dotenv being configured here.
function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const raw of fs.readFileSync(file, 'utf-8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

const env = loadEnv(ENV_PATH);
const secret = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error('STRIPE_SECRET_KEY is not set. Add it to .env first.');
  process.exit(1);
}

const Stripe = require('stripe');
const stripe = Stripe(secret);

const PLANS = [
  { envKey: 'STRIPE_PRICE_STANDARD', name: 'ShieldGuard Standard', amount: 499 },
  { envKey: 'STRIPE_PRICE_PREMIUM', name: 'ShieldGuard Premium', amount: 999 },
  { envKey: 'STRIPE_PRICE_FAMILY', name: 'ShieldGuard Family', amount: 1999 },
];

const CURRENCY = 'usd';

async function findOrCreateProduct(name) {
  const existing = await stripe.products.list({ active: true, limit: 100 });
  const product = existing.data.find((p) => p.name === name);
  if (product) return product;
  return stripe.products.create({
    name,
    metadata: { shieldguard: 'true' },
  });
}

async function findOrCreatePrice(productId, amount) {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });
  const price = prices.data.find(
    (p) =>
      p.currency === CURRENCY &&
      p.unit_amount === amount &&
      p.recurring &&
      p.recurring.interval === 'month',
  );
  if (price) return price;
  return stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: CURRENCY,
    recurring: { interval: 'month' },
    metadata: { shieldguard: 'true' },
  });
}

function updateEnv(envKey, value) {
  const lines = fs.readFileSync(ENV_PATH, 'utf-8').split('\n');
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(envKey + '=')) {
      lines[i] = `${envKey}=${value}`;
      replaced = true;
      break;
    }
  }
  if (!replaced) lines.push(`${envKey}=${value}`);
  fs.writeFileSync(ENV_PATH, lines.join('\n'));
}

async function main() {
  for (const plan of PLANS) {
    console.log(`Processing ${plan.name} ($${(plan.amount / 100).toFixed(2)}/mo)...`);
    const product = await findOrCreateProduct(plan.name);
    const price = await findOrCreatePrice(product.id, plan.amount);
    updateEnv(plan.envKey, price.id);
    console.log(`  -> ${plan.envKey}=${price.id}`);
  }
  console.log('\nDone. .env updated with the Stripe Price IDs.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
