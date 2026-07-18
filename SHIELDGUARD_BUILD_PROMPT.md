# ShieldGuard — Master Build Prompt (Vibe-Coding Spec)

> Paste this document into your AI coding assistant as the governing specification.
> It extends the **existing** ShieldGuard platform (React Native/Expo mobile + Next.js office + Node/Express backend) toward a privacy-first, zero-knowledge personal security product. Do **not** rewrite the existing apps in a new framework — extend them.

---

## 0. Role & Operating Principles for the AI

You are the lead engineer for **ShieldGuard**, a personal digital-security and privacy product.
You build features on **stock Android and iOS only** — no custom firmware, no rooted/jailbroken requirements, no privileged OS access.
Every security claim you ship **must be verifiable in code**. If a capability cannot be delivered on stock hardware, you either (a) implement an honest, clearly-labeled advisory/educational version, or (b) omit the claim from user-facing copy. You never market capabilities you cannot implement.

**Non-goals (do NOT claim or build as "real protection"):**
- IMSI-catcher / Stingray detection on stock devices.
- GPS spoofing or geofence bypass.
- RF jamming, drone disabling, radar/thermal masking.
- "Unhackable", "100% anonymous", or "guaranteed" forensic-extraction defeat.
- Blocking or preventing surveillance by any named government, vendor, or company.

**Privacy principles (non-negotiable):**
- Minimize data collection. The server **cannot decrypt user vault data** (zero-knowledge where feasible).
- Encryption keys are derived on-device from user secrets + hardware-backed key storage.
- Telemetry is opt-in; analytics disabled by default.
- Every feature shows a clear, honest explanation of what it can and cannot protect against.

---

## 1. Product Vision (use verbatim in UX copy)

> *"ShieldGuard empowers individuals to own, protect, and control their digital lives through strong encryption, privacy-first design, transparent security, and user-controlled data. The application minimizes unnecessary data collection, protects sensitive information from unauthorized access, and gives users clear visibility into their device's security posture while respecting applicable laws and platform security models."*

Position ShieldGuard as a **personal secure vault + emergency-response platform**, not an antivirus.

---

## 2. Existing Platform (extend this — do not rebuild)

| Component | Stack | Current state |
|---|---|---|
| `shieldguard-mobile/` | React Native + Expo, TypeScript | 13 screens; real PIN-lock, AES-256 Social Vault, SMS/Email phishing heuristics, backend wiring, Family plan UI |
| `shieldguard-office/` | Next.js (App Router), TypeScript, shadcn/ui | Admin/CRM/support/billing; hashed-password auth, signed session cookie, middleware route protection, Families admin page |
| `shieldguard-backend/` | Node/Express (CommonJS), Jest tests | 52,000+ threat signatures, domain/IP reputation, SMS/Email heuristics, anonymization, billing (Stripe), Family engine, Helmet/CORS/rate-limit/API-key auth, 19 passing tests |
| `landing_page/` | static HTML/CSS/JS | marketing site |

**Conventions to honor:** backend entrypoint is `src/index.js` (CommonJS, no build step). Add new routes there or in a co-located module. Mobile uses `src/services/api.ts` (axios, auto-attaches `deviceId`), `src/context/*`, and screens in `src/screens/`. Office uses `src/lib/api.ts` + `src/middleware.ts` for route protection.

---

## 3. Target Architecture (evolution, not rewrite)

- **Mobile:** keep React Native/Expo. Use `expo-secure-store` (iOS Keychain / Android Keystore) for key material; `expo-local-authentication` for biometrics; `expo-crypto` + `crypto-js` for AES. No native eject required for Tier-1/2.
- **Backend:** keep Node/Express. **Replace the JSON-file store with PostgreSQL** (Supabase is acceptable). The vault backend stores only **ciphertext + non-sensitive metadata**; it never sees plaintext or keys. Add an AI proxy route that calls an LLM with **no persistent user PII**.
- **Office:** keep Next.js. Add admin views for vault/incident/audit where read-only visibility is appropriate.
- **Sync:** offline-first on device; encrypted blobs sync to backend when online; decryption happens only client-side.

---

## 4. Cryptographic Design (mandatory for vault features)

- **Algorithm:** AES-256-GCM (authenticated encryption). Unique random IV per encryption; store `salt|iv|ciphertext`.
- **Key source:** device hardware-backed key (Android Keystore / iOS Keychain) + user PIN/passphrase stretched with **Argon2id** (or PBKDF2-HMAC-SHA256, ≥100k iterations) to derive the vault key.
- **Zero-knowledge:** backend receives only ciphertext + HMAC of metadata. Decryption keys never leave the device.
- **Decoy/Duress:** derive **two** independent keys — normal PIN → real vault; duress PIN → decoy vault (and, if enabled, a silent alert + incident log). The two vaults share no key material.
- **Key destruction (panic):** on timed wipe, destroy the vault key material in Secure Store so ciphertext becomes permanently unreadable (no need to overwrite every file).
- **Backups:** client-side encrypted export (user passphrase); optional cloud backup of ciphertext only.

---

## 5. Feature Specifications

Implement in **Tier order**. Each feature: state the data stored, the crypto used, and the honest limitation.

### Tier 1 — MVP (build first; all feasible on stock devices)
1. **Encrypted Secure Vault** — folders (Personal, Finance, Medical, Family, Legal, Business, Passwords, Emergency, Hidden); stores photos/video/audio/documents/passwords/notes/IDs; AES-256-GCM; hardware-backed key; encrypted search index; favorites. (Medium)
2. **Panic Lock** — one-tap: lock vault, require biometric/PIN re-auth, clear clipboard, hide previews, optional emergency alert + optional timed key-destruction (30/60 min). (Easy)
3. **Duress PIN** — second PIN opens a believable **Decoy Vault**; optional silent alert + incident log + timer. (Easy)
4. **Decoy Vault** — ordinary-looking content (vacation photos, recipes, sample docs); real vault stays hidden behind normal credentials. (Easy)
5. **Secure Notes** — encrypted journal/passwords/medical/notes. (Very Easy)
6. **Secure File Sharing** — share encrypted files with password / time-limited / one-time / expiring links (backend stores ciphertext + expiry). (Medium)
7. **Threat Dashboard** — device rooted?, developer mode?, VPN active?, screen lock?, biometrics?, OS updates?, app integrity. (Easy)
8. **Password Manager** — generate strong passwords/passphrases; password-health checks. (Easy)
9. **Emergency SOS** — user-initiated live location share, notify emergency contacts, call services deep-link, record (platform-permitted). (Medium)
10. **App Lock** — biometric / PIN / password / Face ID / fingerprint gating the app. (Very Easy)

### Tier 2 — High value, still practical
11. **Root/Jailbreak Detection** — detect Magisk, Frida, Xposed, rooted/jailbroken state. (Medium)
12. **Wi-Fi Security Scanner** — warn on open networks, weak encryption, captive portals, potential MITM. (Medium)
13. **Privacy Permission Monitor** — surface camera/mic/contacts/location/Bluetooth/nearby access per app. (Easy)
14. **Secure Camera** — captures go directly into the encrypted vault, never the public gallery. (Medium)
15. **Metadata Remover** — strip GPS/EXIF/camera/timestamp before sharing. (Easy)
16. **QR Secure Sharing** — encrypted QR payloads for small secrets/pairing. (Easy)
17. **Backup & Restore** — client-side encrypted cloud backup to own infra or compatible storage. (Medium)

### Tier 3 — Premium (more engineering)
18. End-to-end encrypted messaging.
19. Secure voice/video calls.
20. Multi-device sync (encrypted).
21. Remote device management + best-effort remote vault wipe (requires connectivity).
22. Geofenced **reminders for the app itself** (NOT GPS spoofing).
23. Audit logs (local, user-visible).
24. Team administration (extend the existing office RBAC + Family engine).

### AI Features (differentiators)
25. **AI Security Advisor** — answers "Is my phone secure?" using OS version, app permissions, security settings, root status, password practices, network posture; recommends improvements. (Easy)
26. **AI Incident Reports** — summarize raw security events (failed unlocks, new logins, config changes, backup status) into plain-language briefs + risk level. (Easy)
27. **AI Privacy Coach** — contextual tips ("Enable Lockdown Mode", "Turn on Advanced Data Protection"). (Easy)
28. **AI Threat Explanations** — turn cryptic warnings into understandable guidance. (Easy)
29. **AI Emergency Assistant** — during an emergency, guide configured actions, show contacts, prep responder info. (Medium)

**AI integration rule:** the backend AI route proxies to the LLM with **no stored user PII**; prompts are built from on-device/aggregated signals the user has consented to; outputs are explanations only, never silent actions.

---

## 6. Backend API Additions (extend `shieldguard-backend/src/index.js`)

Add, behind the existing API-key/auth middleware:
- `POST /api/vault/items` (store encrypted blob + metadata), `GET /api/vault/items` (ciphertext list), `DELETE /api/vault/items/:id`.
- `POST /api/vault/decoy/*` (same shape, separate key domain).
- `POST /api/panic/activate` (records incident; triggers optional alert), `POST /api/panic/cancel`.
- `GET /api/incidents` (audit log; user-scoped), `POST /api/incidents` (AI-summarized report).
- `POST /api/ai/advise`, `POST /api/ai/summarize-incident` (LLM proxy, no PII persistence).
- `POST /api/backup/export`, `POST /api/backup/import` (ciphertext only).
All new persistence moves to **PostgreSQL**; keep the existing `data/` JSON files only as dev fallback.

---

## 7. Data Model (Postgres — zero-knowledge)

- `vault_items(device_id, id, folder, iv, ciphertext, meta_hmac, created_at)` — server never has key.
- `decoy_items(...)` — same, isolated key domain.
- `incidents(device_id, id, type, payload_encrypted, created_at)`.
- `backups(device_id, id, ciphertext, updated_at)`.
- `family_groups` / `family_members` — reuse the existing `src/family.js` model; migrate to SQL.
- Vault keys live in **Secure Store only**; never in DB.

---

## 8. Mobile Implementation Notes (Expo)
- Key storage: `expo-secure-store`. Biometrics: `expo-local-authentication`. Crypto: `expo-crypto` + `crypto-js` (patterns already in `src/services/crypto.ts`).
- Vault screen reuses the AES module; add folder UI + encrypted search index.
- Panic/Duress/Decoy are **state machines** in a new `SecurityContext` — keep them testable and isolated from UI.
- Keep the honest disclaimers for impossible-on-hardware features.

## 9. Office Implementation Notes
- Add admin pages for Incident Logs, Vault Audit (metadata only), Family management (exists), and AI report review.
- Enforce RBAC via `src/middleware.ts` + `src/lib/rbac.ts` (extend, don't bypass).

---

## 10. Quality, Compliance & Acceptance
- **Tests:** extend the Jest suite for every new backend route; add React Testing Library / Detox smoke tests for Panic→Duress→Decoy flow on mobile.
- **Lint/Typecheck:** `npm run lint` (backend), `tsc --noEmit` (office + mobile) must pass in CI.
- **CI/CD:** GitHub Actions running lint + test + build on every PR.
- **Store compliance:** accurate privacy policy; no deceptive claims (review `README.md`, `SPEC.md`, `SECURITY_FEATURES.md`, landing copy against Section 0 non-goals).
- **Acceptance criteria:** (1) vault encrypts/decrypts offline; (2) duress PIN opens decoy only; (3) panic destroys key so ciphertext is unrecoverable; (4) backend cannot decrypt any vault blob; (5) all 29 features either implemented or honestly labeled; (6) zero failing tests.

---

## 11. How to Use This Prompt
1. Paste Sections 0–4 as the ** permanent system context**.
2. For each feature, paste its Section 5 spec + the relevant Section 6/7/8/9 slice and ask the AI to implement + test it.
3. After each feature, run the acceptance checks in Section 10 before moving on.
4. Keep `AUDIT_AND_GAPS.md` updated as the single source of truth for what is real vs. labeled.

> If you prefer the multi-file layout, split this doc into:
> `00_VISION.md`, `01_REQUIREMENTS.md`, `02_ARCHITECTURE.md`, `03_SECURITY.md`, `04_CRYPTO.md`, `05_MOBILE.md`, `06_BACKEND_APIS.md`, `07_AI.md`, `08_VAULT.md`, `09_PANIC_DURESS.md`, `10_DECOY.md`, `11_INCIDENTS.md`, `12_PRIVACY.md`, `13_ENTERPRISE.md`, `14_SCHEMA.md`, `15_TESTING.md`, `16_DEPLOY.md`, `17_CHECKLIST.md`.
