// Manual test for the Stripe webhook endpoint in fallback mode
// (no signature verification). Requires STRIPE_WEBHOOK_SECRET to be empty
// in .env and the backend running on PORT (default 3000).
//
// Usage:
//   node scripts/test-webhook.js [deviceId] [plan]
//   node scripts/test-webhook.js dev-device-123 premium
//
// The endpoint is /api/billing/webhook and expects a Stripe-style event:
//   { type: "checkout.session.completed", data: { object: { ... } } }

const http = require('http');

const PORT = process.env.PORT || 3000;
const deviceId = process.argv[2] || 'dev-device-123';
const plan = process.argv[3] || 'premium';

const event = {
  id: 'evt_test_' + Date.now(),
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_' + Date.now(),
      client_reference_id: deviceId,
      metadata: { plan },
    },
  },
};

const payload = JSON.stringify(event);
const req = http.request(
  {
    host: 'localhost',
    port: PORT,
    path: '/api/billing/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${body}`);
      console.log(`Sent event -> plan="${plan}" device="${deviceId}"`);
    });
  }
);

req.on('error', (err) => {
  console.error(`Request failed: ${err.message}`);
  console.error('Is the backend running? Start it with: npm start');
  process.exit(1);
});

req.write(payload);
req.end();
