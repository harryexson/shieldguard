# ShieldGuard™ — Enterprise Security, Privacy & Production Audit

**Audit date:** 2026-07-18
**Auditor:** Multi-discipline audit (Architecture, Mobile Security, Applied Crypto, Backend, Privacy, Pen-Test, QA, Compliance)
**Scope reviewed:** `shieldguard-backend` (Node/Express), `shieldguard-mobile` (React Native/Expo + TypeScript), `shieldguard-office` (Next.js), `landing_page`, `shared`, plus docs (`SPEC.md`, `SECURITY_FEATURES.md`, `AUDIT_AND_GAPS.md`, `README.md`).
**Method:** Source-level line review + static reasoning + executable regression tests (backend jest suite, 48 passing). Mobile/office were reviewed statically; native deps are not installed in this environment, so their runtime behavior was not executed.

> This audit is **honest by design**. Where a capability cannot be truthfully delivered on stock hardware, that is recorded as a gap — not papered over.

---

## 1. Executive Summary

ShieldGuard is a well-structured, zero-knowledge-by-design security app. The backend separation of concerns is good, detection heuristics are reasonable, the vault stores only client-encrypted ciphertext, and the previous audit pass already removed plaintext office credentials and added real auth + route protection. The codebase is in substantially better shape than the original "complete" claim from `IMPLEMENTATION_SUMMARY.md`.

However, **the platform is NOT production-certified**. The single most important class of defect is **broken access control on user data**: every vault/decoy/password/incident/backup/sync/command/audit record is keyed only by a *client-supplied, spoofable `deviceId`*. There is no per-device authentication token, and until this audit the data-plane routes were not even gated by the server API key. A passive attacker who learns (or guesses) a victim's `deviceId` can enumerate, read metadata, and tamper with/destroy that user's stored records.

This audit **fixed the highest-severity, verifiable issues** in the backend (auth comparison bug, secret-in-URL logging, fabricated AI "confidence", unauthenticated data-plane, under-scoped sync relay) and hardened the mobile KDF (SHA-1 → SHA-256, weak iteration count → 250k). The remaining critical gaps — real device authentication, persistent datastore, CI/secret-scanning, native AES-GCM, and the duress/decoy identity linkage — require architectural work that is documented with concrete remediation below.

---

## 2–7. Scores

| # | Dimension | Score | Basis |
|---|-----------|-------|-------|
| 2 | **Security** | **5/10** | Critical broken-access-control on user data; CBC (not GCM) vault crypto; no per-device auth. Fixed: API-key gating, safe key compare, sync scoping. |
| 3 | **Privacy** | **8/10** | Strong zero-knowledge design (server holds only ciphertext + redacted summaries). Demo users/analytics are local. Minor: `deviceId` reuse links real+decoy vaults (see Critical C1). |
| 4 | **Performance** | **6/10** | JSON-file persistence with per-request full reload → races + lost writes under concurrency; blocking I/O. OK for demo, not for scale. |
| 5 | **Accessibility** | **N/A** | No accessibility audit possible: mobile/office not executed; no a11y metadata reviewed in screens. Requires runtime audit. |
| 6 | **Code Quality** | **7/10** | Clean, lint-clean backend; good modularity. Magic numbers in scoring; some dead/mock data in office; mobile crypto misnamed `secure*` helpers wrap plaintext `AsyncStorage`. |
| 7 | **Production Readiness** | **4/10** | No CI, no containerization, no secret scanning, no persistent DB, no per-device auth, no E2E/pen tests. Several impossible-on-hardware claims remain in `SPEC.md`/`SECURITY_FEATURES.md`. |

---

## 8. Critical Issues

### C1 — Broken access control: user data keyed by spoofable `deviceId` (Backend)
Every record in `vault.js`, `tier2.js`, `tier3.js` is owned by a `deviceId` string the client sends in the request body/query. There is no per-device credential. Anyone who knows or guesses a `deviceId` can:
- `GET /api/vault/items?deviceId=VICTIM` → list vault metadata (including item **names**, stored in cleartext).
- `GET /api/vault/items/:id?deviceId=VICTIM` → retrieve ciphertext.
- `PUT`/`DELETE` → **tamper with or destroy** a victim's data (ransom/denial).
- Enumerate `/api/incidents`, `/api/backup/latest`, `/api/audit`, `/api/device/commands` for the victim.

**Fixed this pass:** all data-plane routes now carry `requireApiKey` (enforced when `REQUIRE_API_KEY=true`), and `/api/sync/pull` now requires `deviceId`. *Residual risk:* the API key is **shared across all clients**, so it stops anonymous scraping but not a malicious user holding the key. **True fix requires per-device authentication** (device attestation + signed, short-lived session tokens), which is not yet implemented. See §14.

### C2 — Duress/Decoy vaults are linkable via the same `deviceId` (Backend + Mobile)
`/api/vault/items` and `/api/vault/decoy/items` are both keyed by the **same** client `deviceId`. An attacker (or coercer) who enumerates `deviceId=X` against both endpoints learns that the user **has both** a real and a decoy vault — which defeats the entire purpose of duress mode (the existence of protected content is revealed). The audit mandate is explicit: *"Ensure the decoy vault cannot expose the existence of protected content."* This is currently violated.

**Fix required (not fully implemented here):** the client must derive a **cryptographically separate, unlinkable identity** for the decoy (e.g., `HMAC(deviceSecret, "decoy")` or a random per-install decoy UUID), and send *that* as `deviceId` to `/api/vault/decoy/items`. The server already treats `deviceId` opaquely; it needs no change beyond this client-side separation. This is a **blocker for production certification**.

### C3 — Vault encryption is AES-CBC, not AES-GCM (Mobile)
`crypto.ts` uses `crypto-js` AES in **CBC** mode. CBC is unauthenticated: ciphertext can be tampered with without detection (bit-flipping), and there is no integrity/authenticity guarantee. The audit requires **AES-256-GCM (authenticated encryption)**. `crypto-js` does not implement GCM. Recommended fix: migrate to a native AES-256-GCM module (`react-native-aes-gcm` or WebCrypto via Expo) and store an auth tag. Until then the vault is confidentiality-only.

**Mitigating factor:** key derivation now uses PBKDF2-HMAC-SHA256 @ 250k iterations (fixed this pass; previously PBKDF2 defaulted to **SHA-1** at 10k iterations — both now corrected).

### C4 — No persistent datastore / concurrency-safe persistence (Backend)
All stores (`index.js`, `vault.js`, `family.js`, `subscriptions.js`, `tier2.js`, `tier3.js`) use synchronous `JSON.parse`/`writeFileSync` reloaded on every request, with only a per-write promise lock in `index.js` (the stores use plain `writeFileSync`, which has **no** lock). Concurrent requests can lose writes (last-writer-wins) and corrupt the JSON. Not safe for multi-instance or production load.

---

## 9. High Issues

- **H1 — `requireApiKey` crashed on mismatched key length (fixed).** `crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(configured))` throws `RangeError` when the two buffers differ in length, turning a wrong key into a **500** instead of a 401. Now wrapped in a length-safe `safeEqual` helper. *Verified by test.*
- **H2 — API key accepted via query string (fixed).** `req.query.apiKey` was honored, which writes the secret into access logs, proxies, and browser history. Now accepted **only** via the `x-api-key` header. *Verified by test.*
- **H3 — Fabricated AI "confidence" (fixed).** `/api/ai/analyze` returned a `confidence` percentage computed as `riskFactors.length * 12 + 20` — a made-up number the audit explicitly forbids ("Never fabricate risk scores… Use clear confidence levels: Confirmed / Likely / Unknown / Unable to verify"). Now returns an honest `verification` field (`confirmed` on a real signature hit, `likely` for heuristic-only, `unknown`, or `unable_to_verify`) plus a `basis`. *Verified by test.*
- **H4 — `/api/sync/pull` unauthenticated & under-scoped (fixed).** Any client knowing a channel name could pull all relayed ciphertext; `deviceId` was ignored. Now requires `deviceId` + API key. *Verified by test.*
- **H5 — Mobile password generator uses `Math.random()`.** `randomPassword()` builds secrets from a non-CSPRNG, making generated passwords statistically predictable. Migrate to `expo-crypto` `getRandomBytesAsync` (async) or a WebCrypto CSPRNG. *Documented; not changed (would break the synchronous call sites without runtime testing).*
- **H6 — `hashPin` is unsalted SHA-256 with a static prefix.** A 4–12 digit PIN has a tiny keyspace; an unsalted hash is trivially precomputed. Acceptable only because the PIN is used for *local* unlock, but it should be replaced by the existing PBKDF2 derivation (already used for the vault key) so there is a single, salted, slow verification path. *Documented.*
- **H7 — Impossible-on-hardware claims persist in marketing docs.** `SPEC.md` still claims IMSI-catcher/Stingray detection, native GPS spoofing, drone/RF blocking, radar/thermal masking, and "defeats physical forensic extraction." These cannot be delivered on stock hardware and create deceptive-claims / app-store rejection risk. `AUDIT_AND_GAPS.md` is honest; `SPEC.md` and `SECURITY_FEATURES.md` are not. **See §13 legal/marketing.**

---

## 10. Medium Issues

- **M1 — PIN hashing vs vault key duplication.** Two key-derivation paths (`hashPin` vs `deriveKey`). Consolidate.
- **M2 — `loadDb()`/store reload-on-every-request.** See C4; also a performance problem (full file read per request).
- **M3 — `checkPackageForThreat` substring matching.** `lower.includes(pkg)` can cause false positives (e.g. a benign package whose name contains a threat package substring). Prefer exact `packageNames` match first, then warn. *Documented.*
- **M4 — Mobile `secureGet/secureSet` wrap `AsyncStorage` (plaintext).** Misleading naming; any caller storing "secure" tokens hits plaintext storage. The real secret store is `expo-secure-store` (used only by the optional unlock-token cache). Rename to avoid misuse.
- **M5 — Office `AUTH_SECRET` dev fallback.** `dev-only-insecure-secret-change-me` is used if `AUTH_SECRET` is unset. Acceptable as a guard but must be enforced (fail closed) in production. Add a startup check that refuses to boot without `AUTH_SECRET` when `NODE_ENV=production`.
- **M6 — No rate limiting on auth in the office app** beyond the global API limiter; add per-account lockout / CAPTCHA after N failures.
- **M7 — README documents a non-working admin password.** README says `admin@shieldguard.dev` / `ShieldGuard2024!`, but the code generates `admin123`. Fix the doc or the seed.
- **M8 — `generateRandomMac` / anonymization endpoints emit fake identifiers.** These are cosmetic noise, not real anonymization; ensure the UI labels them as illustrative, not functional, to avoid misleading users.

---

## 11. Low Issues

- **L1 — `extractHashes` regex matches any 64-hex string** (e.g. UUIDs) → false hash "matches". Acceptable as a tool but note in UI.
- **L2 — Alerts/settings/stats GET are open** (no API key). Intended as public, but `/api/stats` leaks aggregate counts; fine.
- **L3 — `express.json({ limit: '1mb' })`** is reasonable; bump stricter limits on file-bearing routes (backup/sync) if large blobs are expected.
- **L4 — `trust proxy` is set to 1** — correct only behind a known proxy; document.
- **L5 — Office RBAC is path-level (middleware)**, not per-handler; add in-handler role checks for defense-in-depth (already noted in prior audit).

---

## 12. Improvements Made (this pass)

1. **`src/middleware.js`** — `requireApiKey` rewritten: length-safe constant-time comparison (`safeEqual`) that never throws; API key accepted **only** via `x-api-key` header (query-string support removed). Prevents secret leakage to logs and the 500-on-wrong-key bug.
2. **`src/index.js`** — `/api/ai/analyze` (`analyzeThreatRisk`) now returns an honest `verification` (`confirmed`/`likely`/`unknown`/`unable_to_verify`) + `basis` + `knownThreatId`; the fabricated `confidence` number was removed.
3. **`src/index.js`** — Added `requireApiKey` to **all** data-plane routes: vault, decoy, passwords, incidents (create/list/resolve), SOS, backup (export/latest), device security-scan, device command (issue/ack), device commands list, sync push/pull, audit (append/list). In development (`REQUIRE_API_KEY !== 'true'`) these are no-ops, so existing behavior and tests are preserved.
4. **`src/index.js`** — `/api/sync/pull` now requires `deviceId` (previously ignored), closing anonymous relay scraping.
5. **`shieldguard-mobile/src/services/crypto.ts`** — `deriveKey` now uses **PBKDF2-HMAC-SHA256** at **250,000** iterations (previously PBKDF2 defaulted to **SHA-1** at **10,000** — both violations of the encryption audit). Added an explicit code comment documenting the remaining AES-CBC→GCM gap.
6. **`tests/security-audit.test.js`** (new) — regression tests for: honest AI classification (4 cases), `requireApiKey` rejection of missing/wrong-length/query-string keys + header acceptance + dev no-op, and sync-pull `deviceId` requirement.
7. **`tests/tier3.test.js`** — updated the sync-pull test to supply `deviceId` and added an explicit "requires channel and deviceId" case.
8. **`.env.example`** — documented that the API key is header-only and that `REQUIRE_API_KEY=true` requires clients to send it.

**Verification:** `npm test` → **48/48 passing** (was 38; +10 new/updated). `npm run lint` → clean.

---

## 13. Legal & Marketing Audit

The audit's legal/marketing requirement is: remove or rewrite claims of "100% secure / unhackable / impossible to crack / stops government surveillance / blocks all spyware / detects every attack."

- No such absolute claims were found in the **code or the honest `AUDIT_AND_GAPS.md`**.
- **`SPEC.md` and `SECURITY_FEATURES.md` still contain physically impossible claims** (IMSI-catcher/Stingray detection, native GPS spoofing, drone/RF blocking, radar/thermal masking, defeating physical forensic extraction). These must be re-labeled as *"advisory / educational / not available on stock hardware"* or removed before any store submission, or the app risks **Apple App Store Guideline 1.4.1 / Google Play deceptive-claims rejection**.
- Replace with supportable language already present in `AUDIT_AND_GAPS.md` (e.g. "best-effort indicators; honest about limits").

---

## 14. Remaining Recommendations (prioritized)

1. **Per-device authentication (blocks C1).** Issue a device-bound credential at first launch (e.g., attested key + signed session token, or a user account with OAuth/Entra ID). All data-plane routes must authorize the *device*, not just a shared API key.
2. **Unlink duress/decoy identity (blocks C2).** Client derives a separate, unlinkable `deviceId` for the decoy vault.
3. **AES-256-GCM on mobile (blocks C3).** Migrate `crypto.ts` to a native GCM module; store + verify an auth tag.
4. **Persistent, concurrency-safe store (blocks C4).** Replace JSON-file stores with PostgreSQL (or at minimum a locked, append-safe store with atomic writes + WAL). Add the existing file-based lock to `vault.js`/`family.js`/`subscriptions.js`/`tier2.js`/`tier3.js` as an interim.
5. **CI/CD.** GitHub Actions: lint → `tsc --noEmit` → jest → `next build` (office) → `expo export`/build (mobile) → **secret scanning (gitleaks/trufflehog)** → dependency audit (`npm audit` / SCA) → signed release build.
6. **Client sends the API key** once per-device auth exists, or replace the shared key entirely with device tokens (recommend the latter).
7. **Fix docs:** align `README` admin password with code; re-label impossible claims in `SPEC.md`/`SECURITY_FEATURES.md`.
8. **Office hardening:** fail-closed on missing `AUTH_SECRET` in prod; per-account lockout; in-handler RBAC.
9. **Mobile:** migrate `randomPassword` to CSPRNG; consolidate PIN hashing to PBKDF2; rename `AsyncStorage`-backed `secure*` helpers.
10. **Independent security review + penetration test** before any "forensic-resistant" / "unhackable" marketing or enterprise deployment.

---

## 15. Production Certification Checklist

| Requirement | Status |
|---|---|
| No plaintext secrets / hardcoded keys in source | ✅ Pass (only documented dev keys; prod via env) |
| Authenticated encryption (AES-256-GCM) | ❌ Fail (C3: CBC; GCM not available in crypto-js) |
| Hardware-backed keystore / Secure Enclave | ⚠️ Partial (uses `expo-secure-store` for unlock token only; vault key is software-derived) |
| Secure random IVs / KDF | ✅ Pass (random IV; PBKDF2-SHA256 @250k after fix) |
| Per-device authentication / authorization | ❌ Fail (C1: spoofable `deviceId`) |
| Duress vault does not reveal real vault | ❌ Fail (C2: same `deviceId` links both) |
| AI never fabricates scores/confidence | ✅ Pass (H3 fixed; honest `verification`) |
| Rate limiting / brute-force resistance | ⚠️ Partial (global + strict limiter; no per-account lockout) |
| Persistent, safe datastore | ❌ Fail (C4: JSON-file, race-prone) |
| HTTPS / TLS / no secrets in URLs | ✅ Pass (Helmet, CORS allow-list, header-only key after fix) |
| CI / secret scanning / SCA | ❌ Fail (no CI) |
| Honest, non-deceptive marketing | ⚠️ Partial (`AUDIT_AND_GAPS.md` honest; `SPEC.md`/`SECURITY_FEATURES.md` still overstate) |
| Accessibility audit | ❌ Not assessed (no runtime) |
| Independent pen-test | ❌ Not performed |

### Certification result: **NOT PRODUCTION-CERTIFIED**

The platform must **not** be released to production or marketed with security/surveillance-protection claims until **C1, C2, C3, and C4 are resolved** and a CI pipeline with secret scanning plus an independent penetration test is in place. The backend fixes delivered in this audit (auth comparison safety, secret-in-URL removal, honest AI classification, API-key gating of the data plane, sync scoping) materially reduce risk but do not by themselves satisfy the certification bar.

---

*Files modified this pass:* `shieldguard-backend/src/middleware.js`, `shieldguard-backend/src/index.js`, `shieldguard-backend/tests/security-audit.test.js` (new), `shieldguard-backend/tests/tier3.test.js`, `shieldguard-backend/.env.example`, `shieldguard-mobile/src/services/crypto.ts`.
