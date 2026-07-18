const express = require('express');
const { setSubscription } = require('./subscriptions');

// Stripe is loaded lazily so the server still boots without the dependency.
let StripeLib = null;
try {
  StripeLib = require('stripe');
} catch (_) {
  StripeLib = null;
}

function getStripe() {
  if (!StripeLib || !process.env.STRIPE_SECRET_KEY) return null;
  // Cache the client on first use.
  if (!getStripe._client) {
    getStripe._client = StripeLib(process.env.STRIPE_SECRET_KEY);
  }
  return getStripe._client;
}

// Plans are driven by environment variables so no code changes are needed
// to switch between test and live price IDs.
function getPlans() {
  return [
    { id: 'free', name: 'Free', price: 0, interval: null, priceId: null },
    {
      id: 'standard',
      name: 'Standard',
      price: 4.99,
      interval: 'month',
      priceId: process.env.STRIPE_PRICE_STANDARD || null,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      interval: 'month',
      priceId: process.env.STRIPE_PRICE_PREMIUM || null,
    },
    {
      id: 'family',
      name: 'Family',
      price: 19.99,
      interval: 'month',
      deviceLimit: 5,
      priceId: process.env.STRIPE_PRICE_FAMILY || null,
    },
  ];
}

function setupBilling(app) {
  const router = express.Router();

  // Public plan catalogue (frontend reads this to know what is purchasable).
  router.get('/plans', (req, res) => {
    res.json(getPlans());
  });

  // Create a Stripe Checkout session and return the hosted URL to redirect to.
  router.post('/checkout', async (req, res) => {
    const client = getStripe();
    if (!client) {
      return res.status(503).json({
        error:
          'Stripe is not configured. Set STRIPE_SECRET_KEY and the STRIPE_PRICE_* environment variables.',
      });
    }

    const { plan, email, successUrl, cancelUrl } = req.body || {};
    const planDef = getPlans().find((p) => p.id === plan);
    if (!planDef) {
      return res.status(400).json({ error: 'Unknown plan' });
    }
    if (!planDef.priceId) {
      return res
        .status(400)
        .json({ error: `Plan "${plan}" has no Stripe price configured.` });
    }

    const origin = req.headers.origin || 'http://localhost:5000';
    try {
      const session = await client.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: planDef.priceId, quantity: 1 }],
        customer_email: email || undefined,
        client_reference_id: req.body?.deviceId || undefined,
        allow_promotion_codes: true,
        success_url:
          successUrl ||
          `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${origin}/?checkout=cancelled`,
        metadata: { plan: planDef.id },
      });
      res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Confirm a completed checkout and activate the subscription on a device.
  // In production this is driven by the Stripe webhook; this endpoint lets the
  // app/landing page complete activation after being redirected back.
  router.post('/confirm', async (req, res) => {
    const { deviceId, sessionId, plan } = req.body || {};
    if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });
    let tier = plan;
    const client = getStripe();
    if (sessionId && client) {
      try {
        const session = await client.checkout.sessions.retrieve(sessionId);
        tier = session.metadata?.plan || plan;
      } catch (err) {
        return res.status(400).json({ error: 'Invalid or expired checkout session' });
      }
    }
    if (!tier || !['free', 'standard', 'premium', 'family'].includes(tier)) {
      return res.status(400).json({ error: 'A valid plan is required' });
    }
    setSubscription(deviceId, tier, tier);
    if (tier === 'family') {
      const { createFamily } = require('./family');
      createFamily(deviceId, (req.body && req.body.familyName) || 'My Family');
    }
    const { getEntitlements } = require('./subscriptions');
    res.json(getEntitlements(deviceId));
  });

  app.use('/api/billing', router);
}

// The webhook MUST be registered before the global express.json() parser so
// Stripe's raw request body is available for signature verification.
function registerWebhook(app) {
  app.post(
    '/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    (req, res) => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      let event = req.body;

      if (secret) {
        const client = getStripe();
        const sig = req.headers['stripe-signature'];
        if (!client || !sig) {
          return res.status(400).json({ error: 'Invalid webhook configuration' });
        }
        try {
          event = client.webhooks.constructEvent(req.body, sig, secret);
        } catch (err) {
          return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
        }
      } else if (Buffer.isBuffer(req.body)) {
        try {
          event = JSON.parse(req.body.toString('utf-8'));
        } catch (_) {
          return res.status(400).json({ error: 'Invalid webhook payload' });
        }
      }

    if (event && event.type === 'checkout.session.completed') {
      const plan = event.data?.object?.metadata?.plan;
      const deviceId = event.data?.object?.client_reference_id;
      if (deviceId && plan) {
        setSubscription(deviceId, plan, plan);
        if (plan === 'family') {
          const { createFamily } = require('./family');
          createFamily(deviceId, 'My Family');
        }
      }
      console.log(`[billing] Checkout completed for plan: ${plan} device: ${deviceId || '(none)'}`);
    }
      res.json({ received: true });
    }
  );
}

module.exports = { setupBilling, registerWebhook, getPlans };
