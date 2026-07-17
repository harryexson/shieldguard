# ShieldGuard Backend

Threat-intelligence API for the ShieldGuard anti-surveillance platform. Node.js + Express.

## Features
- **Threat database** — 50,000+ deterministic, versioned signatures (run `npm run seed` to (re)generate `data/threats.json`).
- **Package / domain / IP reputation** checks, including a curated surveillance-infrastructure blocklist.
- **Hash matching** — compare file/APK hashes against the known-bad signature index.
- **Heuristic SMS & email phishing detection** (deterministic, explainable scoring).
- **Behavioral risk scoring** for app packages.
- **Anonymization** endpoints (device ID/MAC rotation, metadata stripping, fingerprint randomization, tracker list).
- **Plans & entitlements** with Stripe Checkout (graceful degradation when Stripe is not configured).
- **Security** — Helmet, CORS allow-list, rate limiting, API-key auth for mutating routes, centralized error handling, input validation, structured request logging.
- **Tests** — Jest + Supertest.

## Setup
```bash
npm install
cp .env.example .env   # optional, sensible defaults provided
npm run seed           # generates data/threats.json (50k+ signatures)
npm start
```

## Scripts
| Script | Purpose |
|--------|---------|
| `npm start` | Start the API server |
| `npm run seed` | Regenerate the threat dataset |
| `npm test` | Run the test suite |
| `npm run lint` | Lint source |

## Configuration (env)
See `.env.example`. Notable: `PORT`, `ALLOWED_ORIGINS`, `REQUIRE_API_KEY` / `API_KEY`, `STRIPE_*`.

## API (base `/api`)
- `GET /health`
- `GET /threats`, `GET /threats/feed`, `GET /threats/check/:packageName`
- `GET /network/check/:domain`, `GET /network/check-ip/:ip`, `GET /network/connections`
- `POST /scan` (body: `{ apps: [{ packageName }] }`)
- `GET /scan/history`, `GET /alerts`, `PATCH /alerts/:id/read`, `DELETE /alerts/:id`
- `GET /settings`, `PATCH /settings`
- `GET /stats`, `GET /features`, `GET /me?deviceId=`
- `POST /scan/sms`, `POST /scan/email` (tier-gated)
- `POST /ai/analyze`, `POST /ai/analyze-hashes`, `GET /ai/patterns`
- `GET /anonymize/device`, `POST /anonymize/rotate`, `POST /anonymize/metadata/strip`, `GET /anonymize/fingerprint`, `POST /anonymize/fingerprint/randomize`, `GET /anonymize/trackers`
- `GET /billing/plans`, `POST /billing/checkout`, `POST /billing/confirm`, `POST /billing/webhook`

## Notes on scope
The API is the real detection/intelligence core. Client-side device-hardening features (USB-debugging lock, GPS spoofing, true IMSI-catcher detection, facial-recognition evasion) depend on OS/native capabilities and live in the mobile app; several are honestly documented as best-effort or unavailable on stock hardware.
