# ShieldGuard - Mobile Security Application

A comprehensive mobile security application that protects devices from spyware, malware, government surveillance tools, and intrusive tracking.

## The Surveillance Threat

State-grade surveillance spyware like Pegasus poses a severe risk to personal privacy worldwide. Built by NSO Group and ostensibly intended for law enforcement, these tools have repeatedly been found targeting journalists, human rights defenders, attorneys, and ordinary people — siphoning private communications, GPS coordinates, photographs, and live audio/video streams directly from compromised devices.

These threats are classified as **zero-click exploits**, meaning infection can occur through a simple incoming message — no user interaction required. Attackers leverage undisclosed flaws in messaging platforms and operating system kernels to gain full device access without any visible indicators.

ShieldGuard is engineered specifically to counter these advanced persistent surveillance threats. The most effective protection combines vigilance with the right tools.

### Self-Protection Guidelines Against Advanced Spyware

1. **Audit Installed Applications** — Go through your app list and remove anything unfamiliar. Surveillance payloads frequently masquerade as system utilities or hide under generic labels to avoid detection.

2. **Apply System Updates Promptly** — Zero-click exploits depend on unpatched software bugs. Configure automatic OS updates and apply security patches the moment they're released.

3. **Control Permission Granularity** — Many spyware modules require camera, microphone, or location access to function. Deny these permissions for any app that doesn't genuinely need them for core features.

4. **Deploy ShieldGuard** — ShieldGuard monitors running processes, scans installed packages against known threat signatures, inspects network traffic for command-and-control callbacks, and checks domain reputations in real time to intercept surveillance infrastructure.

5. **Turn On Multi-Factor Authentication** — MFA adds a barrier against account takeover across email, financial services, and social platforms, limiting the damage if credentials are leaked.

6. **Harden Your Network** — Replace default router credentials, keep router firmware current, and route traffic through a VPN to prevent man-in-the-middle interception.

7. **Recognize Infection Signals** — Common indicators include rapid battery depletion, unexplained data consumption, background services running without user initiation, and the camera indicator activating spontaneously.

## Project Structure

```
├── shieldguard-office/     # Next.js Back Office web app (CRM, Support, Billing, etc.)
│   ├── src/
│   │   ├── app/           # 17 route pages (dashboard, CRM, support, billing, etc.)
│   │   ├── components/    # UI components + layout (sidebar, header)
│   │   └── lib/           # Auth context, RBAC system, mock data, API client
│   └── package.json
│
├── shieldguard-mobile/    # React Native mobile app
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── constants/   # Colors, configuration, threat database
│   │   ├── context/     # State management
│   │   ├── hooks/       # Custom hooks for security features
│   │   ├── screens/     # App screens
│   │   ├── services/    # API services
│   │   └── types/      # TypeScript types
│   ├── App.tsx         # App entry point
│   └── package.json
│
├── shieldguard-backend/       # Node.js Express API server
│   ├── src/
│   │   ├── index.js           # Canonical API server (CommonJS, run directly)
│   │   ├── threatData.js      # Curated threat families + 50k+ signature generator
│   │   ├── detection.js       # SMS/email phishing heuristics
│   │   ├── features.js        # Feature/tier catalogue
│   │   ├── subscriptions.js   # Device entitlement persistence
│   │   ├── billing.js         # Stripe Checkout + webhook
│   │   └── middleware.js      # Auth, CORS, rate-limit, validation, error handling
│   ├── scripts/seed-threats.js# Regenerates data/threats.json (run `npm run seed`)
│   ├── data/                  # Generated at runtime (gitignored)
│   ├── tests/                 # Jest + Supertest suite
│   └── package.json
└── SPEC.md             # Project specification
```

## Security Features

### Core Mobile App Features (13 Screens)
| Screen | Description |
|--------|-------------|
| **Dashboard** | Security score overview, quick actions, feature navigation |
| **App Scanner** | Scans installed apps against malware/spyware signatures |
| **Network Monitor** | Monitors traffic for suspicious connections |
| **Permission Audit** | Reviews app permissions for suspicious access |
| **Security Audit** | Comprehensive 8-check vulnerability assessment |
| **Settings** | Configure protection, scan schedules, anonymization |
| **Threat Alerts** | Real-time security alert feed with severity indicators |
| **SMS Security** | Blocks malicious SMS, spoof detection, command injection quarantine |
| **Cell Signal Protection** | Connection inspection + advisory IMSI-catcher / rogue-tower guidance (true baseband detection is not possible on stock hardware — shown honestly) |
| **Email Security** | Phishing detection, spoof prevention, malicious link sandboxing |
| **Device Extraction Defense** | PIN-locked forensic extraction prevention (4–12 digit PIN, session expiry, lockout, optional auto-wipe, biometrics) protecting app data; does **not** block hardware USB extraction of an unlocked device |
| **Social Vault** | AES-256 encrypted local vault for social credentials/notes (key derived from PIN) |
| **Anonymization** | Device ID masking, MAC rotation, metadata stripping, fingerprint randomization, tracker blocking |

### Backend API Features
- **Threat Database API** - Query known malware/spyware signatures
- **App Analysis API** - Submit app hash for threat analysis
- **Network Reputation API** - Check domain/IP reputation
- **Threat Feed API** - Latest threats database
- **Scan API** - Submit and retrieve scan history
- **Alert API** - Manage security alerts (read, dismiss)
- **Settings API** - Read and update app configuration
- **Stats API** - Platform usage statistics
- **AI Analysis API** - Heuristic threat scoring with 10 behavioral patterns, risk factor detection, and recommendation engine
- **Anonymization API** - Device ID masking, MAC rotation, metadata stripping, browser fingerprint randomization, tracker blocking

## Privacy & Security Feature Tiers

ShieldGuard is built in tiers. **Tier 1** and **Tier 2** are implemented in this repository
(as of 2026-07-18). All vault/backup features are **zero-knowledge**: the backend stores only
client-encrypted ciphertext + non-sensitive metadata and never sees keys or plaintext. A full,
honest accounting is in [AUDIT_AND_GAPS.md](./AUDIT_AND_GAPS.md).

### Tier 1 — Encrypted Vault & Emergency Privacy (implemented)
- **Encrypted Secure Vault** — folders (Personal/Finance/Medical/Family/Legal/Business/Passwords/Emergency/Hidden); photos, docs, notes, passwords, IDs encrypted on-device (AES-256, PIN-derived key).
- **Secure Notes** — encrypted notes.
- **Password Manager** — generates strong passwords; stores encrypted entries with strength badges.
- **Secure File Sharing** — one-time / TTL-bounded share links (server relays ciphertext only).
- **Panic Lock** — one-tap lock + optional timed key-destruction.
- **Duress PIN** — a second PIN silently opens a decoy vault and logs an incident.
- **Decoy Vault** — separate encrypted store with ordinary-looking content.
- **Threat Dashboard** — scores a device's security posture (root, screen lock, VPN, biometrics, OS updates, app integrity) and lists fixes.
- **Emergency SOS** — records an incident and offers platform deeplinks (`tel:`/SMS) to notify contacts. Actual message sending uses platform APIs (best-effort).
- **App Lock** — PIN/biometric gate on the vault.

### Tier 2 — Device Hardening & AI (implemented)
- **Root/Jailbreak Detection** — best-effort indicators (Magisk/Frida/Xposed, `su` binaries, `__DEV__`); honest about limits.
- **Wi-Fi Security Scanner** — warns on open/weak networks and potential MITM (security type is not always readable on Expo).
- **Privacy Permission Monitor** — shows this app's camera/mic/location/contacts/Bluetooth grants + OS review guidance.
- **Secure Camera** — captures go straight into the encrypted vault, never the public gallery.
- **Metadata Remover** — re-encodes images to strip EXIF/GPS before sharing.
- **QR Secure Sharing** — encrypts a small secret into a scannable QR (recipient needs the same PIN).
- **Backup & Restore** — client-side encrypted cloud backup (ciphertext only).
- **AI Security Advisor** — turns device signals into a risk level + recommendations (rule-based by default; optional LLM).
- **AI Incident Reports** — summarizes security events (panic/duress/SOS) into a plain-language brief + risk level. The server stores only a redacted summary.

### Tier 1 & Tier 2 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/vault/items | Store encrypted vault item (ciphertext + metadata) |
| GET | /api/vault/items | List vault items (metadata only, no ciphertext) |
| GET / PUT / DELETE | /api/vault/items/:id | Fetch / update / delete one vault item |
| POST / GET / GET / DELETE | /api/vault/decoy/items | Decoy vault (same shape, isolated store) |
| POST / GET / GET / DELETE | /api/passwords/items | Encrypted password-manager entries |
| POST | /api/share | Create one-time/TTL secure share (returns token) |
| GET | /api/share/:token | Fetch shared ciphertext (404 when used up/expired) |
| POST / GET | /api/incidents | Create / list panic·duress·sos incidents |
| POST | /api/incidents/:id/resolve | Resolve an incident |
| GET | /api/incidents/admin | Aggregated incident counts (`requireApiKey`) |
| POST | /api/threat-dashboard | Score a device posture → score / riskLevel / recommendations |
| POST | /api/emergency/sos | Record an SOS incident (server records only) |
| POST | /api/backup/export | Store latest client-encrypted backup (ciphertext) |
| GET | /api/backup/latest | Fetch latest backup (ciphertext) |
| POST / GET | /api/device/security-scan | Persist / fetch latest device security posture |
| POST | /api/ai/advise | Security recommendations from signals (rule-based or optional LLM) |
| POST | /api/ai/summarize-incident | Summarize events into a report + risk level |
| GET | /api/ai/reports/admin | Aggregated AI-report stats (`requireApiKey`) |

## Running the Application

### 1. Start the Backend API Server
```bash
cd shieldguard-backend
npm install
npm run seed     # optional: regenerate the 50k+ signature dataset
npm start        # runs src/index.js (CommonJS, no build needed)
```
The API will run on http://localhost:3000

### 2. Start the Mobile App
```bash
cd shieldguard-mobile
npm install
npm start
```

Or for Android:
```bash
npm run android
```

Or for iOS:
```bash
npm run ios
```

## Threat Categories Covered

### Spyware Detection
- Pegasus (NSO Group)
- FinFisher/FinSpy (Gamma Group)
- Predator (Intellexa)
- Commercial stalkerware

### Malware Protection
- Emotet
- FluBot
- Triada
- xHelper
- Joker

### Privacy Protection
- Excessive permissions
- Data exfiltration
- Location tracking
- Keyloggers

## Technology Stack

### Mobile
- React Native with Expo
- TypeScript
- React Navigation
- Axios

### Backend
- Node.js with Express
- JavaScript (CommonJS — `src/index.js` is the canonical entrypoint, no build step)
- RESTful API

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Server health check |
| GET | /api/threats | All threats |
| GET | /api/threats/feed | Latest threat feed |
| GET | /api/threats/check/:package | Check package against threat DB |
| GET | /api/network/check/:domain | Domain reputation check |
| GET | /api/network/check-ip/:ip | IP reputation check |
| GET | /api/network/connections | Active network connections |
| POST | /api/scan | Submit scan results |
| GET | /api/scan/history | Scan history (last 10) |
| GET | /api/alerts | Get security alerts |
| PATCH | /api/alerts/:id/read | Mark alert as read |
| DELETE | /api/alerts/:id | Dismiss/delete alert |
| GET | /api/settings | Get app settings |
| PATCH | /api/settings | Update app settings |
| GET | /api/stats | Platform statistics |
| POST | /api/ai/analyze | AI heuristic threat analysis |
| POST | /api/ai/analyze-hashes | Extract and match file hashes |
| GET | /api/ai/patterns | Detection patterns and signatures |
| GET | /api/anonymize/device | Get device anonymization status |
| POST | /api/anonymize/rotate | Rotate device identifiers |
| POST | /api/anonymize/metadata/strip | Strip metadata from files |
| GET | /api/anonymize/fingerprint | Get browser fingerprint status |
| POST | /api/anonymize/fingerprint/randomize | Randomize fingerprint tokens |
| GET | /api/anonymize/trackers | Tracker blocking database |

---

## Back Office (shieldguard-office)

The Back Office is a Next.js web application for ShieldGuard's internal operations and enterprise customer management. It provides a full suite of business tools with Role-Based Access Control (RBAC).

### Access & Roles

Login at `/login` with the **Developer Admin** credential for full access:

| Email | Password | Role |
|-------|----------|------|
| `admin@shieldguard.dev` | `ShieldGuard2024!` | **Developer Super Admin** |

Or use any of these demo accounts (password is `{firstname}123`, e.g. `sarah123`):

| Email | Role | Access |
|-------|------|--------|
| admin@shieldguard.dev | Developer Super Admin | Full access to all modules |
| sarah@shieldguard.com | Super Admin | Full access to all modules |
| mike@shieldguard.com | Support Agent | Support tickets, CRM read |
| jessica@shieldguard.com | Sales Rep | CRM, Sales pipeline, Pitch/Investor decks |
| david@shieldguard.com | Marketing Manager | Campaigns, Promotions, Analytics |
| lisa@shieldguard.com | Accountant | Billing, Accounting, Invoices, Reports |
| john@acmecorp.com | Enterprise Admin | Org dashboard, Team management, Scan |
| alice@acmecorp.com | Enterprise IT Support | Org dashboard, Support tickets, User support |
| bob@acmecorp.com | Enterprise User | Personal dashboard, Scan device |
| chris@gmail.com | Individual User | Personal dashboard, Scan device |

### Modules

| Module | Routes | Description |
|--------|--------|-------------|
| **Dashboard** | `/dashboard` | Role-aware homepage: office KPIs or security threat dashboard |
| **CRM** | `/crm` | Customer management, profiles, interaction history |
| **Support** | `/support`, `/support/[id]` | Ticket lifecycle, priority queue, replies |
| **Billing** | `/billing` | Subscriptions, invoices, plan catalog, promotions/discounts |
| **Accounting** | `/accounting` | Revenue tracking, transactions, reports, charts |
| **Marketing** | `/marketing` | Campaign management, performance metrics |
| **Sales** | `/sales` | Pipeline kanban, leads, deal stages |
| **Sales Deck** | `/sales/pitch-deck` | Enterprise sales presentation |
| **Investor Deck** | `/sales/investor-deck` | Investor fundraising presentation |
| **Enterprise** | `/enterprise` | Org security dashboard, real-time threat feed, device overview |
| **Team Management** | `/enterprise/users` | Enterprise admin: invite/manage users, assign roles |
| **On-Demand Scan** | `/scan` | Quick scan or full deep scan with results & history |
| **User Admin** | `/admin/users` | Super admin: manage all platform users |
| **Roles & Permissions** | `/admin/roles` | Super admin: view role hierarchy & permission matrix |

### Enterprise Features

- **Enterprise Admin accounts** can invite internal users to their organization
- **RBAC for org users**: Enterprise Admin, IT Support, and standard Enterprise User roles
- **IT Support team** can assist non-tech-savvy staff within their organization
- **Real-time security dashboard** showing threats blocked/mitigated across all org devices
- **Org-wide scanning** capability

### Running the Back Office

```bash
cd shieldguard-office
npm install
npm run dev
```

Opens at http://localhost:3001 (configured to avoid conflict with backend API on port 3000).

---

## Configuration

### Mobile App Settings
- Real-time Protection (on/off)
- Network Monitoring (on/off)
- Threat Alerts (on/off)
- Push Notifications (on/off)
- Auto Scan (on/off)
- Scan Interval (hourly/6h/12h/daily)

---

## Family Plan

A **Family** subscription (**$19.99/month, covers up to 5 devices**) lets one owner protect
their household. It is a server-side plan tier (`family`) that grants every premium
feature to the owner **and** to members who join.

Flow:
1. User buys the Family plan in the mobile app (`/billing/checkout`) → backend creates the family group on checkout confirm.
2. Owner opens **Family** (new tab) → sees an **invite code** and can **invite members by name + email/phone** (`/api/family/invite`).
3. A family member installs the app, enters the **invite code** (`/api/family/join`) → their device gains Family-tier coverage (up to the 5-device limit; further joins return `409`).
4. Owner can **remove** a member; a member can **leave**. The office admin **Families** page (`/admin/families`) lists all family subscriptions (name, devices used/limit, pending invites).

Entitlements are derived from family membership: `GET /api/me?deviceId=` returns
`tier: "family"` + a `family` view for any covered device. See `AUDIT_AND_GAPS.md` for the full data model.

---

## Current Status & Known Limitations

This repository was re-audited on 2026-07-17. A full, honest accounting of what is
real, what was hardened, and what remains a gap is in **[AUDIT_AND_GAPS.md](./AUDIT_AND_GAPS.md)**.
Key points:

- The backend threat database is now **genuinely 50,000+ signatures** (regenerated via
  `npm run seed` in `shieldguard-backend`); previously the docs overstated a 50k count
  from only ~20 hand-written entries.
- The mobile app's **Device Extraction PIN lock** and **Social Media Encryption Vault**
  are now real client-side implementations (PIN-hashed, AES-encrypted at rest).
- **Tier 1** (encrypted secure vault, panic/duress/decoy, secure notes, password manager,
  secure file sharing, threat dashboard, emergency SOS, app lock) and **Tier 2** (root/jailbreak
  detection, Wi-Fi scanner, permission monitor, secure camera, metadata remover, QR secure
  sharing, encrypted backup & restore, AI security advisor, AI incident reports) are implemented
  across the mobile app, backend (`src/vault.js`, `src/tier2.js`, `src/ai.js`), and office admin
  pages. See the **Privacy & Security Feature Tiers** section above.
- The backend test suite is **32 passing** (detection, hash matching, vault/decoy/password/share,
  incidents, threat-dashboard, SOS, backup, device-scan, AI advise/summarize) and lint is clean.
- Some advertised capabilities are **physically impossible on stock phone hardware**
  (true IMSI-catcher/Stingray detection, native GPS spoofing, drone/RF blocking, defeating
  physical forensic extraction). These are documented honestly in-app and are not faked.
- The office app previously had **fake auth (plaintext creds in source, no session, no route
  protection)**. It now has hashed-password auth, an httpOnly signed session cookie, and
  middleware route protection; demo users remain source-seeded by design.

**Stay safe. Stay protected.** 🛡️