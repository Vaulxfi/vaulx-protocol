# Inventory 03 — Auth + SIWS (Laravel → Next.js port)

Scope: every auth-flow primitive that lives in `site/` today. Read-only inventory of the Laravel surface plus a concrete mapping recommendation for the Next.js port. All paths are absolute.

---

## 1. SIWS (Sign in With Solana)

### 1.1 Files
- Controller: `/Users/gogy/MyCODE/VAULX/site/app/Http/Controllers/Api/SiwsController.php`
- Base58 helper: `/Users/gogy/MyCODE/VAULX/site/app/Support/Base58.php`
- Profile linking endpoint (re-uses the same verify primitive): `/Users/gogy/MyCODE/VAULX/site/app/Http/Controllers/ProfileController.php` (`linkSolana`)
- Browser client (`signInWithSolana`): `/Users/gogy/MyCODE/VAULX/site/resources/js/wallet.js:228-278`
- Login view button + handler: `/Users/gogy/MyCODE/VAULX/site/resources/views/auth/login.blade.php:16,58`
- Migration adding `solana_pubkey`, `auth_provider`: `/Users/gogy/MyCODE/VAULX/site/database/migrations/2026_04_24_010000_add_siws_to_users_table.php`
- Routes: `/Users/gogy/MyCODE/VAULX/site/routes/web.php:54-57`

### 1.2 Endpoints

`GET /auth/siws/challenge` (`name: siws.challenge`)
- Generates a 32-char nonce via `Str::random(32)` (alphanumeric, not raw bytes).
- Stores `{ issued_at, ip }` in cache under key `siws:nonce:{nonce}` with TTL `300s` (`SiwsController::NONCE_TTL`).
- Returns JSON:
  ```json
  {
    "nonce": "<32 chars>",
    "issued_at": "<ISO8601>",
    "expires_in": 300,
    "message": "vaulx.fi wants you to sign in with your Solana account.\n\nDomain: {host}\nStatement: Sign in to Vaulx.\nNonce: {nonce}\nIssued At: {issuedAt}",
    "domain": "<request host>"
  }
  ```
- `domain` is `$request->getHost()` (not hard-coded to vaulx.fi). The literal `vaulx.fi` in the first line of the message is a brand label, not derived from the host.

`POST /auth/siws/verify` (`name: siws.verify`)
- Validates body shape (`SiwsController.php:52-56`):
  - `nonce` — required, exactly 32 chars
  - `pubkey` — required, 32-44 chars (base58 of a 32-byte ed25519 key)
  - `signature` — required, 64-128 chars (base58 of 64 bytes)
- Pulls the cached nonce with `Cache::pull(...)` — single-use, replay-safe by design.
- Base58-decodes `pubkey` and `signature` using the in-tree `App\Support\Base58` (Bitcoin alphabet). Replaced `stephenhill/base58` after a recurring vendor/ deploy bug.
- Strict length checks: pubkey must be 32 bytes, signature 64 bytes (422 on mismatch).
- Re-builds the canonical message server-side from `(host, nonce, issued_at)` so the client cannot smuggle a different statement.
- Signature verification: `sodium_crypto_sign_verify_detached($sig, $msg, $pk)` — libsodium ed25519, no third-party crypto.
- On success: lookup or create user, log in via `Auth::login($user, remember: true)`, regenerate session, return `{ ok, created, redirect }`.

### 1.3 Address → User mapping
`SiwsController.php:92-105`:
- `User::where('solana_pubkey', <pubkey>)->first()`
- If absent, auto-provisions a row with:
  - `name = "Solana user XXXX…YYYY"` (first/last 4 of pubkey)
  - `email = "<pubkey>@siws.vaulx.local"` (synthetic, satisfies unique email constraint)
  - `password = Hash::make(Str::random(48))` (unusable bcrypt)
  - `role = 'borrower'`
  - `wallet_address = solana_pubkey = <pubkey>`
  - `auth_provider = 'solana'`

`solana_pubkey` has a unique index (migration above). `auth_provider` is a 16-char string defaulting to `'email'`.

### 1.4 Replay-attack defense
- Nonce is `Str::random(32)` — alphanumeric pseudo-random, not cryptographic raw bytes, but 32 chars of `[A-Za-z0-9]` is ~190 bits; sufficient.
- Stored once, pulled (deleted) on verify — single-use.
- TTL = 300 s, enforced by the cache backend (auto-expiry).
- `Cache::pull()` is atomic — concurrent verifies on the same nonce: the loser hits `invalid_or_expired_nonce`.
- Cache backend in dev/prod default: `CACHE_DRIVER=file` (`.env.example:19`). For Next.js port this becomes a Supabase table or KV (see §5).
- The cached payload includes `ip` but the verify path does **not** check it. Currently informational only.
- Domain binding: the message embeds `$request->getHost()` and verify re-derives from the same source — same-host enforcement, but no signature over the domain by the client.

### 1.5 Session on success
- `Auth::login($user, remember: true)` — sets `laravel_session` cookie + `remember_web_*` long-lived cookie.
- `$request->session()->regenerate()` — rotates session id, defeats fixation.
- Session driver: `file` per `.env.example:22`.
- Cookie attributes: encrypted (`EncryptCookies` middleware), `HttpOnly`, default `SameSite=Lax`. The cross-origin demo path can flip to `SameSite=None; Secure; Partitioned` via `PartitionSessionCookie` middleware (see §2.5) — SIWS does **not** trigger this.
- Response includes a `redirect` field (admin dashboard if `isAdmin()`, else borrower dashboard). The client is expected to navigate; no server-side 302.

### 1.6 Roles/whitelist consequences of SIWS
- None. SIWS always provisions as `role = 'borrower'` for new users. No allow-list, no signer-address gating, no off-chain authorization mapping.
- Existing users keep whatever role they had. Linking a wallet to an existing borrower/evaluator/admin account preserves the role (via `ProfileController::linkSolana`).

### 1.7 Browser client (`resources/js/wallet.js:228-278`)
- Detects `window.solana` (Phantom) or `window.backpack`.
- Calls `provider.connect()`, then `GET /auth/siws/challenge`.
- `provider.signMessage(new TextEncoder().encode(message), 'utf8')` — Phantom's API. Returns `{ signature: Uint8Array }`.
- Base58-encodes the signature with the inline `base58Encode(bytes)` using BigInt arithmetic.
- POSTs JSON to `/auth/siws/verify` with `X-CSRF-TOKEN` from the meta tag and `credentials: 'same-origin'`. CSRF protection is therefore active on the SIWS verify path.

### 1.8 Profile link variant (`ProfileController::linkSolana`)
- Same challenge/verify primitives (consumes a nonce from the same `siws:nonce:` cache namespace).
- Rejects if `solana_pubkey` is already attached to another user (manual unique check on top of the unique index).
- On success: updates `solana_pubkey` and `wallet_address` on the authenticated user. Does not re-log-in.

---

## 2. Standard email/password auth

### 2.1 Files
- Controller: `/Users/gogy/MyCODE/VAULX/site/app/Http/Controllers/AuthController.php`
- Password reset: `/Users/gogy/MyCODE/VAULX/site/app/Http/Controllers/PasswordResetController.php`
- Routes: `/Users/gogy/MyCODE/VAULX/site/routes/web.php:29-51`
- Middleware: `Authenticate.php`, `RedirectIfAuthenticated.php`, `VerifyCsrfToken.php`, `NoStoreOnAuth.php`
- Auth config: `/Users/gogy/MyCODE/VAULX/site/config/auth.php`
- Session config: `/Users/gogy/MyCODE/VAULX/site/config/session.php`

### 2.2 Endpoints
| Method+Path | Controller | Middleware | Notes |
|---|---|---|---|
| `GET /login` | `AuthController::showLogin` | `guest, auth.nocache` | |
| `POST /login` | `AuthController::login` | `guest, auth.nocache` | `Auth::attempt` + `session()->regenerate()` |
| `GET /register` | `AuthController::showRegister` | `guest, auth.nocache` | |
| `POST /register` | `AuthController::register` | `guest, auth.nocache` | New users default to `role=borrower` |
| `POST /logout` | `AuthController::logout` | `auth` | Invalidate + regenerate token |
| `GET /forgot-password` | `PasswordResetController::showForgot` | `guest, auth.nocache` | |
| `POST /forgot-password` | `PasswordResetController::sendLink` | `guest, auth.nocache` | `Password::sendResetLink` |
| `GET /reset-password/{token}` | `showReset` | `guest, auth.nocache` | |
| `POST /reset-password` | `reset` | `guest, auth.nocache` | `Password::reset` |
| `GET /csrf-fresh` | inline closure | `auth.nocache` | Returns `csrf_token()` as plain text |

### 2.3 Session config
- `config/auth.php`: default guard `web`, driver `session`, provider `eloquent` → `App\Models\User`.
- `config/session.php`: driver `file`, lifetime 120 min, `expire_on_close = false`, `encrypt = false`. SameSite + Secure read from env.
- `config/auth.php` `passwords.users`: `password_resets` table, tokens expire after 60 min, throttle 60 s. Standard Laravel implementation, no custom token format.

### 2.4 Password hashing
- `Hash::make($plain)` — Laravel default is bcrypt (`config/hashing.php` not overridden). Stored in `users.password`.

### 2.5 CSRF
- `\App\Http\Middleware\VerifyCsrfToken` extends framework default with one bypass: requests carrying a valid `?token=<DEMO_MAGIC_TOKEN>` skip CSRF entirely (see §4). All other requests go through standard token check.
- CSRF token lives in the session; surfaced to views via the `@csrf` Blade directive and a `<meta name="csrf-token">` for the SIWS fetch.
- `XSRF-TOKEN` cookie is set by Laravel for AJAX double-submit.

### 2.6 The `/csrf-fresh` endpoint — why it exists
- `/Users/gogy/MyCODE/VAULX/site/routes/web.php:41-43` and `NoStoreOnAuth.php`.
- Production runs nginx + `fastcgi_cache`. nginx was caching the rendered `/login` HTML — including the per-session `_token` hidden input. Returning visitors got the cached HTML with a stale token but a fresh session cookie → every login produced 419 "Page Expired".
- Mitigations layered:
  1. `auth.nocache` middleware (`NoStoreOnAuth.php`) emits `Cache-Control: no-store, no-cache, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, `Vary: Cookie`, plus a custom `X-Vaulx-NoStore: 1` debug header on every auth-flow GET.
  2. Inline JS on the auth views calls `GET /csrf-fresh` and overwrites the `_token` field before submit. `/csrf-fresh` returns `csrf_token()` as plain text with the same no-store headers — guaranteed to be the session's current token even if the surrounding HTML was served from cache.
  3. nginx config also needs `fastcgi_no_cache` / `fastcgi_cache_bypass` (documented in deploy README, not in this repo).

### 2.7 `auth` middleware (`Authenticate.php`)
- Standard Laravel: redirects to `route('login')` for HTML, returns 401 for `expectsJson()` requests.
- The `Authenticate` alias is `auth` in `Http/Kernel.php:74`.

### 2.8 `auth.nocache` middleware (`NoStoreOnAuth.php`)
- Aggressive no-store headers. Covered in §2.6.

---

## 3. Roles and permissions

### 3.1 Storage
- Single `role` column on `users` table.
- Type: MySQL `ENUM('borrower','admin','evaluator_online','evaluator_offline')` — set in migration `2026_04_13_000001_add_garantifi_fields_to_users_table.php`, expanded in `2026_04_24_020002_expand_user_role_enum.php`. SQLite stores as plain string.
- Default value: `'borrower'`.

### 3.2 Role values actually used (single source of truth, not Spatie)
- `borrower` — default for sign-ups, SIWS auto-provisions to this.
- `admin` — back-office full access.
- `evaluator_online` — online evaluator forms.
- `evaluator_offline` — offline evaluator forms.
- The task brief mentions `owner` and `super_admin`. These do **not** exist as separate role enum values in the database:
  - "Super admin" maps onto `admin`. `User::isSuperAdmin()` is literally `return $this->isAdmin();` (`User.php:65-68`). The Super-Admin-only routes (`SuperAdminController`) are gated by the same `admin` middleware as regular admin pages.
  - "Owner" is not a role. It refers to `OwnerDecisionController` — the *asset owner* (the borrower) deciding on the evaluator's range. Gated by plain `auth` middleware plus per-asset ownership checks in the controller (not surfaced here).

### 3.3 Role-check API (User model, `User.php:40-68`)
- `isAdmin()` → `role === 'admin'`
- `isBorrower()` → `role === 'borrower'`
- `isEvaluatorOnline()` → `role === 'evaluator_online'`
- `isEvaluatorOffline()` → `role === 'evaluator_offline'`
- `isEvaluator()` → online OR offline
- `isSuperAdmin()` → alias of `isAdmin()`

### 3.4 Middleware that consume the role
Registered in `Http/Kernel.php:82-85`:
- `admin` → `AdminMiddleware` (403 unless `isAdmin()`)
- `evaluator.online` → `EvaluatorOnlineMiddleware` (online evaluator OR admin)
- `evaluator.offline` → `EvaluatorOfflineMiddleware` (offline evaluator OR admin)
- `evaluator.any` → `EvaluatorAnyMiddleware` (any evaluator OR admin)

Admin is implicitly granted access through every evaluator gate.

### 3.5 Route groups (`routes/web.php`)
- `/admin/*` → `auth, admin`
- `/evaluator` (dashboard) → `auth, evaluator.any`
- `/evaluator/online/*` → `auth, evaluator.online`
- `/evaluator/offline/*` → `auth, evaluator.offline`
- `/dashboard/*` (borrower) → `auth` only — borrower routes are not role-gated beyond authentication; ownership checks happen in the controller.
- `/evaluation/*` (OwnerDecisionController) → `auth` only.
- `/profile/*` → `auth`.

### 3.6 No Spatie, no policies, no gates
- No `spatie/laravel-permission` in `composer.json` (not surveyed here but confirmed by code search — controllers reach for `$user->isAdmin()` etc., never `$user->hasRole()` or `Gate::allows()`).
- No `AuthServiceProvider` gate registrations seen in scope.
- Authorization is hard-coded role checks in middleware and controllers.

---

## 4. Demo magic-link login

### 4.1 Files
- `/Users/gogy/MyCODE/VAULX/site/app/Http/Controllers/DemoSessionController.php`
- `/Users/gogy/MyCODE/VAULX/site/app/Http/Middleware/DemoTokenAuthenticator.php`
- `/Users/gogy/MyCODE/VAULX/site/app/Http/Middleware/VerifyCsrfToken.php` (demo-token bypass)
- `/Users/gogy/MyCODE/VAULX/site/app/Http/Middleware/PartitionSessionCookie.php` (CHIPS cookie partitioning)
- Routes: `web.php:26`, `api.php:36`

### 4.2 Token format and lifetime
- Single environment variable `DEMO_MAGIC_TOKEN` (shared secret, opaque string).
- **No expiry** beyond the env var rotating. Constant-time compared via `hash_equals`. Empty/unset env disables both endpoints.

### 4.3 Endpoints
`GET /demo` (`name: demo.magic`, `DemoSessionController::magicLink`)
- Query params:
  - `token` — required, must equal `DEMO_MAGIC_TOKEN`.
  - `as` — optional, `admin` or anything else. `admin` logs in as `demo-admin@vaulx.fi`, otherwise `demo-borrower@vaulx.fi`.
  - `next` — optional redirect path. Whitelisted to start with `/` (not `//`) and first segment in `{/dashboard, /admin, /evaluator, /profile}` — open-redirect mitigation.
- Demo users must exist (seeded via `php artisan demo:seed`); 503 if missing.
- Relaxes session cookie for this request only via `config(['session.same_site' => 'none', 'session.secure' => true])` so the cookie survives cross-origin iframe embedding.
- `Auth::login($user, remember: true)` + `session()->regenerate()`.
- Redirects to `next` (if safe) or the role's default dashboard.

`POST /api/demo/reset` (`DemoSessionController::reset`)
- Header `X-Demo-Token` must match.
- Runs `Artisan::call('demo:seed')`, returns command output as JSON.

### 4.4 Stateless companion: `DemoTokenAuthenticator` middleware
- Registered in the `web` middleware group between `StartSession` and `VerifyCsrfToken` (`Http/Kernel.php:46`).
- On every request: if `?token=<DEMO_MAGIC_TOKEN>` is present, picks the demo user via `?as=` or path-prefix heuristic (`/admin/*` → demo-admin, else demo-borrower) and calls `Auth::onceUsingId($user->id)`. **No session write**, per-request only.
- Token-wins-always semantics: overrides an existing session if a leftover session cookie is present (documented rationale: prevents Chrome leaking dev session into a partner iframe).
- `VerifyCsrfToken` is extended to short-circuit when a valid demo token is on the request (otherwise iframe POSTs with no XSRF cookie 419).

### 4.5 CHIPS / Partitioned cookies
- `PartitionSessionCookie` middleware appends `; Partitioned` to the session `Set-Cookie` whenever `session.same_site === 'none' && session.secure === true`. Only active for the demo cross-origin path.
- Placed first in the `web` group so its after-pass runs last in the response pipeline, after `EncryptCookies::encrypt` and `StartSession::addCookieToResponse`.

---

## 5. Next.js mapping recommendation

### 5.1 High-level decision
The Next.js app already has `@vaulx/supabase` wired (`packages/supabase/src/server.ts`) with both service-role and per-user SSR clients. Use **Supabase Auth as the session/identity store**, write a **custom SIWS verify route** that mints a Supabase session for the wallet address. Do not add NextAuth — it duplicates Supabase Auth's cookie handling and forces a second user table.

Rationale:
- Identity is already in Supabase (`packages/supabase` package consumed by `apps/web`).
- Supabase Auth as of 2024 ships a first-class Web3 sign-in for Solana (`signInWithWeb3({ chain: 'solana', statement })`) that produces a SIWS message and mints a JWT session — this replaces the Laravel cache+verify primitive natively.
- Server-side verification fallback is straightforward with `tweetnacl` (`nacl.sign.detached.verify`) for any path we cannot route through Supabase's hosted flow (e.g. profile-linking).

The integrator should re-confirm the exact Supabase Auth SIWS API surface via Context7 before implementation (the Context7 fetch was unavailable in this discovery session).

### 5.2 SIWS port

| Laravel piece | Next.js target |
|---|---|
| `GET /auth/siws/challenge` | (a) Supabase `signInWithWeb3` handles message+nonce client-side; OR (b) `app/api/auth/siws/challenge/route.ts` that returns the same payload shape, stores nonce in a `siws_nonces` Supabase table (or Upstash Redis) with `expires_at` |
| `POST /auth/siws/verify` | `app/api/auth/siws/verify/route.ts` — verify with `nacl.sign.detached.verify(sigBytes, msgBytes, pubkeyBytes)` from `tweetnacl`, then `supabase.auth.admin.createUser` (service role) keyed off the pubkey, then mint a session via `supabase.auth.admin.generateLink({ type: 'magiclink' })` or `setSession` |
| `Cache::pull('siws:nonce:…')` | Supabase table with unique nonce + `delete().eq(...)` (single-use), TTL via `expires_at` and a cron sweep, OR Upstash Redis with `GETDEL` semantics |
| `sodium_crypto_sign_verify_detached` | `nacl.sign.detached.verify(signature, message, publicKey)` (`tweetnacl`) — operates on `Uint8Array`. Note: `@solana/web3.js` does not expose this primitive; bring in `tweetnacl` or `@noble/ed25519` (the latter is async by default) |
| `App\Support\Base58` | `bs58` npm package (already a transitive dep of `@solana/web3.js`) or `@solana/web3.js`'s `bs58` re-export. Confirm exact import via Context7 before adoption |
| Login button JS | `app/(auth)/login/page.tsx` with `@solana/wallet-adapter-react`'s `useWallet().signMessage` (already in deps) |

### 5.3 Standard auth port
- Email/password → Supabase Auth `supabase.auth.signInWithPassword` / `signUp` / `signOut` / `resetPasswordForEmail`. Replaces `AuthController`, `PasswordResetController`, the `password_resets` table.
- Sessions live in Supabase-signed JWT cookies (`sb-<project>-auth-token`), handled by `@supabase/ssr` (already imported in `packages/supabase/src/server.ts`).
- CSRF: Supabase's auth cookie + same-site flags handle session CSRF; mutating routes that aren't auth-protected should use Next.js Server Actions (which include their own framework-level CSRF) or a custom origin check. The Laravel `_token` form-field pattern is not needed.
- `auth.nocache` middleware → not needed. Next.js does not cache HTML by default; if a CDN sits in front, the equivalent is `export const dynamic = 'force-dynamic'` and `Cache-Control: private, no-store` headers on auth routes.
- `/csrf-fresh` endpoint → **delete**. The nginx fastcgi_cache pathology that motivated it does not exist in Vercel/Next deployment.

### 5.4 Roles
- Add a `role` column to the Supabase `users` (or `profiles`) table, same enum: `borrower | admin | evaluator_online | evaluator_offline`.
- Enforce in middleware: a Next.js `middleware.ts` at the app root that reads the Supabase session, fetches the role, and rewrites/forbids based on path prefix. Mirrors `AdminMiddleware` / `EvaluatorXMiddleware` 1:1.
- Augment with Supabase **RLS policies** on every domain table so even a leaked service-role bug cannot let a borrower read another borrower's loan. The Laravel app has no equivalent — this is a real upgrade.
- Drop `isSuperAdmin()` alias; if a true super-admin tier appears later, add a separate enum value and a `superAdminOnly()` middleware.

### 5.5 Demo magic-link
- Direct port to a Next.js route: `app/api/demo/route.ts` (GET) and `app/api/demo/reset/route.ts` (POST), gated by `DEMO_MAGIC_TOKEN` env. Constant-time compare with `crypto.timingSafeEqual`.
- For the cross-origin iframe scenario: Supabase's auth cookies already set `SameSite=Lax` by default and can be configured for `None; Secure; Partitioned` via the Supabase project's auth settings — no per-request cookie surgery needed in app code.
- The `Auth::onceUsingId` stateless path → Next.js equivalent is a per-request signed JWT in a query param that a custom middleware exchanges for a transient Supabase session (or skip entirely if the iframe use case is dropped post-Colosseum). Confirm scope with George before porting.

### 5.6 Migration risks / gotchas
- **Synthetic emails** for SIWS users (`<pubkey>@siws.vaulx.local`) violate Supabase Auth's email-verification flow. Use a dedicated `sign_in_with_solana` provider via `signInWithWeb3` (no email required) rather than carrying the synthetic-email convention across.
- The Laravel role enum is database-level; Supabase prefers a free-form text column or a separate `user_roles` table. A `CHECK` constraint replicates the enum guarantee.
- Replay defense: do **not** rely on Postgres TTL — there is no native row TTL. Use `expires_at` + an indexed sweep job or Upstash Redis.
- `tweetnacl.sign.detached.verify` requires `Uint8Array` inputs of the exact byte lengths the Laravel code already enforces (32-byte pubkey, 64-byte signature). Keep those length checks.
- `bs58` versus `@solana/web3.js`'s base58: pin one, document it in the SIWS verify route.

---

## STATUS
STATUS: shipped
What landed:
- `/Users/gogy/MyCODE/VAULX/docs/plans/inventory/03-auth-and-siws.md` — full SIWS, email/password, roles, demo magic-link inventory plus Next.js mapping recommendation
What's blocked:
- Context7 lookup for NextAuth / Supabase Auth / tweetnacl was unavailable (invalid API key in environment). Mapping recommendation cites APIs that the Next.js integrator MUST re-verify via Context7 before implementing (Supabase `signInWithWeb3`, `tweetnacl.sign.detached.verify`, `@supabase/ssr` cookie adapter).
What's next: hand to the integrator for the SIWS-on-Supabase spec; cross-reference with inventory 01 (routes/controllers) and 02 (data model) once those land.
