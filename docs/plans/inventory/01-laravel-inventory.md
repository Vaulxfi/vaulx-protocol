# Laravel inventory — `site/` (source of truth for Next.js port)

Generated from a read-only walk of `site/` at branch `claude/flamboyant-euclid-8c570e`. This document is the architect's primer for the Next.js parity port. Nothing in `site/` was modified.

Conventions used below:
- "Path" is always absolute under the repo.
- Route name in the form `prefix.action` matches `route()` calls.
- Middleware aliases are defined in `site/app/Http/Kernel.php:69-84`.
- The `web` middleware group (kernel:32-53) wraps every web route below; only the *extra* per-route middleware is listed.

---

## 1. Routes

### 1.1 Public web (`site/routes/web.php`)

| Verb | URL | Controller@method | Name | Extra middleware | Notes |
|---|---|---|---|---|---|
| GET | `/` | `HomeController@index` | `home` | — | Marketing landing; pulls live on-chain `LoanConfig`/`Vault` (60s cache) |
| GET | `/simulator` | `HomeController@simulator` | `simulator` | — | Loan-sim page with live vault capacity strip |
| GET | `/terms` | closure → `view('terms')` | `terms` | — | Static legal |
| GET | `/faq` | closure → `view('faq')` | `faq` | — | Static FAQ |
| GET | `/team` | closure → `view('team')` | `team` | — | Team page (named-exception in CLAUDE.md §2.4) |
| GET | `/demo` | `DemoSessionController@magicLink` | `demo.magic` | — | Token-gated magic-link login; relaxes session cookie to `SameSite=None; Secure` per-request only |
| GET | `/csrf-fresh` | inline closure | `csrf.fresh` | `auth.nocache` | Returns current `csrf_token()` as plain text; defeats fastcgi_cache 419s |

### 1.2 Auth (`web.php` guest+nocache group, lines 29-51)

| Verb | URL | Controller@method | Name | Extra middleware |
|---|---|---|---|---|
| GET | `/login` | `AuthController@showLogin` | `login` | `guest`, `auth.nocache` |
| POST | `/login` | `AuthController@login` | — | `guest`, `auth.nocache` |
| GET | `/register` | `AuthController@showRegister` | `register` | `guest`, `auth.nocache` |
| POST | `/register` | `AuthController@register` | — | `guest`, `auth.nocache` |
| POST | `/logout` | `AuthController@logout` | `logout` | `auth` |
| GET | `/forgot-password` | `PasswordResetController@showForgot` | `password.request` | `guest`, `auth.nocache` |
| POST | `/forgot-password` | `PasswordResetController@sendLink` | `password.email` | `guest`, `auth.nocache` |
| GET | `/reset-password/{token}` | `PasswordResetController@showReset` | `password.reset` | `guest`, `auth.nocache` |
| POST | `/reset-password` | `PasswordResetController@reset` | `password.update` | `guest`, `auth.nocache` |
| GET | `/auth/siws/challenge` | `Api\SiwsController@challenge` | `siws.challenge` | — |
| POST | `/auth/siws/verify` | `Api\SiwsController@verify` | `siws.verify` | — |

Web group includes `DemoTokenAuthenticator` (kernel:50) which transparently logs in the demo user on any route that carries a valid `?token=…`.

### 1.3 Profile (auth)

| Verb | URL | Controller@method | Name | Extra middleware |
|---|---|---|---|---|
| GET | `/profile` | `ProfileController@show` | `profile.show` | `auth` |
| POST | `/profile` | `ProfileController@update` | `profile.update` | `auth` |
| POST | `/profile/link-solana` | `ProfileController@linkSolana` | `profile.link-solana` | `auth` |

### 1.4 Borrower (`dashboard` prefix, `borrower.*` name space, `auth`)

| Verb | URL | Controller@method | Name |
|---|---|---|---|
| GET | `/dashboard` | `BorrowerController@dashboard` | `borrower.dashboard` |
| GET | `/dashboard/asset/new` | `BorrowerController@createAsset` | `borrower.asset.create` |
| POST | `/dashboard/asset` | `BorrowerController@storeAsset` | `borrower.asset.store` |
| GET | `/dashboard/asset/{asset}` | `BorrowerController@showAsset` | `borrower.asset.show` |
| GET | `/dashboard/loan/request` | `BorrowerController@requestLoan` | `borrower.loan.request` |
| POST | `/dashboard/loan/request` | `BorrowerController@storeLoan` | `borrower.loan.store` |
| GET | `/dashboard/loans` | `BorrowerController@myLoans` | `borrower.loans` |
| GET | `/dashboard/loan/{loan}` | `BorrowerController@showLoan` | `borrower.loan.show` |
| POST | `/dashboard/installment/{payment}/pay` | `BorrowerController@payInstallment` | `borrower.payment.pay` |
| GET | `/dashboard/asset/{asset}/reloan` | `BorrowerController@showReloan` | `borrower.reloan.show` |
| POST | `/dashboard/asset/{asset}/reloan` | `BorrowerController@storeReloan` | `borrower.reloan.store` |

`dashboard()` auto-redirects admins and evaluators to their own home (BorrowerController.php:24-29).

### 1.5 Evaluator (`evaluator/*`, `evaluator.*`)

| Verb | URL | Controller@method | Name | Extra middleware |
|---|---|---|---|---|
| GET | `/evaluator` | `EvaluatorController@dashboard` | `evaluator.dashboard` | `auth`, `evaluator.any` |
| GET | `/evaluator/online` | `EvaluatorController@online` | `evaluator.online.index` | `auth`, `evaluator.online` |
| GET | `/evaluator/online/{evaluation}` | `EvaluatorController@showOnline` | `evaluator.online.show` | `auth`, `evaluator.online` |
| POST | `/evaluator/online/{evaluation}` | `EvaluatorController@submitOnline` | `evaluator.online.submit` | `auth`, `evaluator.online` |
| GET | `/evaluator/offline` | `EvaluatorController@offline` | `evaluator.offline.index` | `auth`, `evaluator.offline` |
| GET | `/evaluator/offline/{evaluation}` | `EvaluatorController@showOffline` | `evaluator.offline.show` | `auth`, `evaluator.offline` |
| POST | `/evaluator/offline/{evaluation}` | `EvaluatorController@submitOffline` | `evaluator.offline.submit` | `auth`, `evaluator.offline` |

`online()` and `offline()` index actions redirect to the unified dashboard; the legacy per-layer dashboard renderers (`onlineLegacy`, `offlineLegacy`) still exist in the controller but are not routed.

### 1.6 Owner decision (post-evaluation, `auth`)

| Verb | URL | Controller@method | Name |
|---|---|---|---|
| GET | `/evaluation/{asset}/range` | `OwnerDecisionController@showRange` | `evaluation.range` |
| POST | `/evaluation/{asset}/decide` | `OwnerDecisionController@decide` | `evaluation.decide` |

### 1.7 Admin (`admin/*`, `admin.*`, `auth` + `admin`)

| Verb | URL | Controller@method | Name |
|---|---|---|---|
| GET | `/admin` | `AdminController@dashboard` | `admin.dashboard` |
| GET | `/admin/evaluations` | `AdminController@pendingAssets` | `admin.assets.pending` |
| GET | `/admin/evaluation/{asset}` | `AdminController@evaluateAsset` | `admin.asset.evaluate` |
| POST | `/admin/evaluation/{asset}/approve` | `AdminController@approveEvaluation` | `admin.asset.approve` |
| GET | `/admin/loans` | `AdminController@loans` | `admin.loans` |
| GET | `/admin/loan/{loan}` | `AdminController@showLoan` | `admin.loan.show` |
| POST | `/admin/loan/{loan}/approve` | `AdminController@approveCustody` | `admin.loan.approve` |
| POST | `/admin/loan/{loan}/default` | `AdminController@markDefaulted` | `admin.loan.default` |
| POST | `/admin/loan/{loan}/repaid` | `AdminController@markRepaid` | `admin.loan.repaid` |
| GET | `/admin/market-config` | `SuperAdminController@marketConfig` | `admin.market-config.index` |
| POST | `/admin/market-config` | `SuperAdminController@storeMarketConfig` | `admin.market-config.store` |
| POST | `/admin/market-config/{config}/delete` | `SuperAdminController@deleteMarketConfig` | `admin.market-config.delete` |
| GET | `/admin/evaluators` | `SuperAdminController@evaluatorsList` | `admin.evaluators.index` |
| POST | `/admin/evaluators/assign` | `SuperAdminController@assignEvaluation` | `admin.evaluators.assign` |
| GET | `/admin/users` | `AdminController@users` | `admin.users` |
| GET | `/admin/vaults` | `AdminController@vaults` | `admin.vaults` |
| GET | `/admin/multisig` | `AdminController@multisig` | `admin.multisig` |
| GET | `/admin/monitor-brz` | `AdminController@monitorBrz` | `admin.monitor-brz` |
| GET | `/admin/cron-bot` | `AdminController@cronBot` | `admin.cron-bot` |
| GET | `/admin/onchain-events` | `AdminController@eventosOnchain` | `admin.eventos-onchain` |

`SuperAdminController::isSuperAdmin()` is currently aliased to `isAdmin()` (User.php:65-68) — no true super-admin tier exists; the "Super Admin" routes are gated only by the `admin` middleware.

### 1.8 API (`site/routes/api.php`, `api` middleware group)

| Verb | URL | Controller@method | Auth |
|---|---|---|---|
| GET | `/api/user` | inline `$request->user()` | `auth:sanctum` |
| GET | `/api/rates` | `Api\RatesController@index` | public |
| GET | `/api/rates/brz-monitor` | `Api\RatesController@brzMonitor` | public |
| GET | `/api/vaults` | `Api\VaultsController@index` | public |
| GET | `/api/onchain/events` | `Api\EventsController@index` | public |
| GET | `/api/onchain/cron-runs` | `Api\EventsController@cronRuns` | public |
| POST | `/api/onchain-events/{event}` | `Api\BridgeWebhookController@store` | HMAC (inline, `X-Vaulx-Timestamp` + `X-Vaulx-Signature`) |
| POST | `/api/demo/reset` | `DemoSessionController@reset` | `X-Demo-Token` header |

The `api` middleware group is `throttle:api` + `SubstituteBindings` only (Sanctum stateful middleware is commented out at Kernel.php:56).

### 1.9 Broadcast + console routes

- `routes/channels.php` — defines `App.Models.User.{id}` private channel for user-scoped notifications (the only broadcast channel).
- `routes/console.php` — only the default `inspire` artisan closure.

---

## 2. Controllers

All under `site/app/Http/Controllers/`. Public methods only.

### 2.1 Web controllers

| File | Methods | Key dependencies |
|---|---|---|
| `HomeController.php` | `index`, `simulator` | `SolanaBridge`, `FetchesCachedBridgeReads` trait, `config('solana_bridge.demo_asset_mint')` |
| `AuthController.php` | `showLogin`, `login`, `showRegister`, `register`, `logout` | `User`, `Auth`, `Hash`. Login routes admins to `admin.dashboard`, all others to `borrower.dashboard`. |
| `PasswordResetController.php` | `showForgot`, `sendLink`, `showReset`, `reset` | `Password` facade |
| `DemoSessionController.php` | `magicLink`, `reset` | `User`, `Artisan` (`demo:seed`), session cookie mutation (`relaxSessionCookieForCrossOrigin`), whitelist `safeNextPath`. Token constant-time via `hash_equals` against `env('DEMO_MAGIC_TOKEN')`. |
| `ProfileController.php` | `show`, `update`, `linkSolana` | `Cache::pull` of SIWS nonce, `Base58`, `sodium_crypto_sign_verify_detached`, `User` |
| `BorrowerController.php` | `dashboard`, `createAsset`, `storeAsset`, `showAsset`, `requestLoan`, `storeLoan`, `showLoan`, `payInstallment`, `myLoans`, `showReloan`, `storeReloan` | `Asset`, `Loan`, `LoanPayment`, `Evaluation`, `MarketPriceService`, `SolanaBridge::createCcbTrdc`, `OnchainEvent`, notifications `LoanCompleted` |
| `EvaluatorController.php` | `dashboard`, `online`, `onlineLegacy` (unused), `showOnline`, `submitOnline`, `offline`, `offlineLegacy` (unused), `showOffline`, `submitOffline` | `Evaluation`, `EvaluatorReport`, `User`, `ScoringService::consolidate`, notifications `OnlineReportCompleted`, `OfflineReportCompleted`, `SuspiciousAlignmentDetected`, `TripleConvergenceBonus`. Auto-claim semantics: first evaluator to open an unassigned evaluation gets it. |
| `OwnerDecisionController.php` | `showRange`, `decide` | `Asset`, `Evaluation`. Transitions `pending_owner_decision` → `pending_offline` or `aborted`. |
| `AdminController.php` | `dashboard`, `pendingAssets`, `evaluateAsset`, `approveEvaluation`, `loans`, `showLoan`, `approveCustody`, `markDefaulted`, `markRepaid`, `vaults`, `multisig`, `eventosOnchain`, `cronBot`, `monitorBrz`, `users` | `Asset`, `Loan`, `LoanPayment`, `User`, `SolanaBridge::confirmCustodyAndDisburse`, `InterestCalculator`, `FetchesCachedBridgeReads`, notifications `AssetEvaluated`, `LoanApproved`. Dashboard stats filter to loans with a non-placeholder `confirm_custody_tx`. |
| `SuperAdminController.php` | `marketConfig`, `storeMarketConfig`, `deleteMarketConfig`, `evaluatorsList`, `assignEvaluation` | `MarketConfig`, `Evaluation`, `EvaluatorScore`, `User`. Gated by `admin` middleware only. |
| `Controller.php` | base class | `AuthorizesRequests`, `DispatchesJobs`, `ValidatesRequests` |
| `Concerns/FetchesCachedBridgeReads.php` | trait: `fetchCachedBridgeRead($key, $ttl, $fetch)` | `Cache`. Caches `ok:true` bridge reads, passes through `ok:false` uncached. |

### 2.2 API controllers (`Controllers/Api/`)

| File | Methods | Key dependencies |
|---|---|---|
| `BridgeWebhookController.php` | `store(Request, $event)` | `OnchainEvent::firstOrCreate` on `(signature, event_name)`, HMAC-SHA256 verify over `${ts}\nPOST\n${path}\n${rawBody}` with `config('solana_bridge.shared_secret')`. 300s freshness window. |
| `EventsController.php` | `index`, `cronRuns` | `OnchainEvent`, `CronRun`, `SolanaService::explorerUrl`, `SolanaService::getSlot` |
| `RatesController.php` | `index`, `brzMonitor` | `CurrencyService::snapshot`, `BrzPriceReading`. `brzMonitor` persists every read and classifies depeg tier (`normal/alert/paused/convert`). |
| `SiwsController.php` | `challenge`, `verify` | `Cache` (nonce TTL 300s), `Base58`, `sodium_crypto_sign_verify_detached`, `User`, `Auth::login`. Auto-creates a borrower user on first verify with a wallet that doesn't exist yet. |
| `VaultsController.php` | `index` | `SolanaBridge::readVault`, raw `DB::table('loans')` for `lent` accounting filtered to non-placeholder `confirm_custody_tx`. |

---

## 3. Blade views

Root: `site/resources/views/`. The two real layouts are `layouts/app.blade.php` (public chrome — navbar + footer + content yield) and `layouts/panel.blade.php` (logged-in two-column sidebar + main; `panel-content` yield).

### 3.1 Public / static

| File | Layout | Sections | Purpose |
|---|---|---|---|
| `welcome.blade.php` | (none) | — | Stock Laravel welcome — **not routed**, dead. |
| `home.blade.php` | `layouts.app` | `title`, `content` | Marketing landing; renders on-chain stats strip from `$onchain` payload. |
| `simulator.blade.php` | `layouts.app` | `title`, `content` | Loan-sim calculator + live capacity banner. |
| `terms.blade.php` | `layouts.app` | `title`, `content` | Static terms of use. |
| `faq.blade.php` | `layouts.app` | `title`, `content` | Static FAQ. |
| `team.blade.php` | `layouts.app` | `title`, `content` | Team page (real names allowed — see CLAUDE.md §2.4). |

### 3.2 Auth

| File | Layout | Sections | Purpose |
|---|---|---|---|
| `auth/login.blade.php` | `layouts.app` | `title`, `content` | Email/password login form. |
| `auth/register.blade.php` | `layouts.app` | `title`, `content` | Borrower signup form. |
| `auth/forgot-password.blade.php` | `layouts.app` | `title`, `content` | Request reset link. |
| `auth/reset-password.blade.php` | `layouts.app` | `title`, `content` | Set new password with token. |

### 3.3 Profile (shared, panel)

| File | Layout | Sections | Purpose |
|---|---|---|---|
| `profile.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | Account form + SIWS wallet-linking widget. |

### 3.4 Borrower

| File | Layout | Sections | Purpose |
|---|---|---|---|
| `borrower/dashboard.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `page-actions`, `panel-content` | Stats cards, assets table, loans table, pending-owner-decision panel. |
| `borrower/sidebar.blade.php` | partial | — | Borrower nav. |
| `borrower/onboarding.blade.php` | partial | — | First-visit modal; included from dashboard. |
| `borrower/assets/create.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | Asset registration form; supports `?demo=fill` autofill. |
| `borrower/assets/show.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `page-actions`, `panel-content` | Asset detail w/ journey timeline. |
| `borrower/loans/index.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | All loans for this borrower. |
| `borrower/loans/request.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | 4-step loan wizard; supports `?demo=fill`. |
| `borrower/loans/reloan.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | One-click re-loan against previously-evaluated asset. |
| `borrower/loans/show.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | Loan detail + installment schedule + pay-installment form. |

### 3.5 Evaluator

| File | Layout | Sections | Purpose |
|---|---|---|---|
| `evaluator/dashboard.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | Unified queue: pending online + pending offline + recent + own scores. |
| `evaluator/sidebar.blade.php` | partial | — | Evaluator nav (labels switch by online/offline/both). |
| `evaluator/online/dashboard.blade.php` | `layouts.panel` | as above | Legacy online-only dashboard (route currently redirects to unified). |
| `evaluator/online/form.blade.php` | `layouts.panel` | as above | Online report form (value, grade, condition matrix). |
| `evaluator/offline/dashboard.blade.php` | `layouts.panel` | as above | Legacy offline-only dashboard. |
| `evaluator/offline/form.blade.php` | `layouts.panel` | as above | Offline report form (caliber, serial, authenticity, timing). |

### 3.6 Owner decision

| File | Layout | Sections | Purpose |
|---|---|---|---|
| `owner/evaluation/range.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | Show appraisal range to owner; advance vs abort decision. |

### 3.7 Admin

| File | Layout | Sections | Purpose |
|---|---|---|---|
| `admin/dashboard.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | Protocol overview KPIs, pending queues, status donut, on-chain snapshot. |
| `admin/sidebar.blade.php` | partial | — | Admin nav (Overview, Operations, On-chain, Tools). |
| `admin/assets/index.blade.php` | `layouts.panel` | as above | Assets pending evaluation (legacy single-layer flow). |
| `admin/assets/evaluate.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | Approval form; surfaces consolidated Evaluation if present, falls back to user-submitted `estimated_value`. |
| `admin/loans/index.blade.php` | `layouts.panel` | as above | Filterable loan list. |
| `admin/loans/show.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `page-actions`, `panel-content` | Loan detail + approve / mark-defaulted / mark-repaid controls. |
| `admin/users/index.blade.php` | `layouts.panel` | as above | All users w/ asset+loan counts. |
| `admin/market-config/index.blade.php` | `layouts.panel` | as above | BRL correction factor table CRUD. |
| `admin/evaluators/index.blade.php` | `layouts.panel` | as above | Evaluator roster + assignment form + pending evaluations list. |
| `admin/vaults.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `page-actions`, `panel-content` | Vault state widget (XHR `/api/vaults`). |
| `admin/multisig.blade.php` | `layouts.panel` | `sidebar`, `page-title`, `page-subtitle`, `panel-content` | Squads multisig snapshot (off-chain mirror from `config/squads.php`). |
| `admin/monitor-brz.blade.php` | `layouts.panel` | as above | BRZ depeg monitor chart (XHR `/api/rates/brz-monitor`). |
| `admin/cron-bot.blade.php` | `layouts.panel` | as above | Cron run feed (XHR `/api/onchain/cron-runs`). |
| `admin/eventos-onchain.blade.php` | `layouts.panel` | as above | On-chain events feed (XHR `/api/onchain/events`). |

### 3.8 Components (Blade `<x-…>`)

All under `components/`; each takes typed `@props`.

| File | Purpose |
|---|---|
| `page-header.blade.php` | Title + subtitle row. |
| `card.blade.php` | Wrapper card with optional accent / title / icon. |
| `stat-card.blade.php` | KPI tile (label / value / hint / variant). |
| `status-badge.blade.php` | Bootstrap badge wrapper. |
| `score-pill.blade.php` | Evaluator tier badge via `EvaluatorScore::computeTier`. |
| `money.blade.php` | Currency-formatted amount. |
| `empty-state.blade.php` | Empty list/table placeholder w/ optional CTA. |
| `skeleton.blade.php` | Loading skeleton (rows + cols). |
| `triangle.blade.php` | SVG triangle viz for online / offline / market convergence. |
| `solana-panel.blade.php` | Loan on-chain panel (PDA + confirm_custody tx only). |
| `explorer.blade.php` | Solana Explorer link (`tx` / `address`). |
| `avatar-initials.blade.php` | Initial avatar (hash-coloured). |
| `asset-next-step.blade.php` | Compact next-step badge — uses `AssetStatusGuide::for`. |
| `asset-journey.blade.php` | Full 6-step timeline — uses `AssetStatusGuide::journey`. |
| `asset-progress-card.blade.php` | Multi-asset progress summary — uses `AssetStatusGuide`. |

---

## 4. Models (`site/app/Models/`)

| File | Table | Key relationships | Casts | Notable scopes / methods |
|---|---|---|---|---|
| `User.php` | `users` | hasMany `Asset`, `Loan`, `EvaluatorScore`; hasMany `Loan` as `approvedLoans` (FK `approved_by`) | `email_verified_at:datetime`, `is_active:bool` | Roles: `isAdmin`, `isBorrower`, `isEvaluatorOnline`, `isEvaluatorOffline`, `isEvaluator`, `isSuperAdmin` (==isAdmin). Traits: `HasApiTokens`, `Notifiable`. |
| `Asset.php` | `assets` (soft-deletes) | belongsTo `User`; hasMany `Loan`, `MarketSnapshot`; hasOne `Evaluation`; hasOne `activeLoan` (loans in pending_custody/active/overdue) | `estimated_value`, `appraised_value:decimal:2`, `appraisal_date:date`, `custody_received_at:datetime`, `photo_urls:array` | Scopes: `pendingEvaluation`, `evaluated`. Categories: watch/jewelry/art/vehicle. Custody statuses: pending_evaluation/evaluated/with_owner/in_transit/in_custody/released. Helpers: `isAvailableForLoan`, `explorerUrl`. |
| `Loan.php` | `loans` (soft-deletes) | belongsTo `User`, `Asset`, `approver` (User on `approved_by`); hasMany `LoanPayment` | many decimal:2, dates as `date`/`datetime` | Scopes: `active`, `overdue`, `pendingCustody`, `forUser`, `repaid`. Statuses: pending_custody/active/overdue/defaulted/repaid. `getSolanaLoanIdAttribute` — deterministic base58 derivation via `sha256('loan-'.id)`; persists once known. `activateAsApproved` flips to active, creates installments via `InterestCalculator::linearSchedule`, marks asset `in_custody`. `generateCode()` → `GF-YYYY-NNNNN`. `reloanEligible(Asset)` enforces appraisal-age, no-open-loan, prior-repaid. |
| `LoanPayment.php` | `loan_payments` | belongsTo `Loan` | `amount_due`, `principal_portion`, `interest_portion`, `amount_paid:decimal:2`, dates | Statuses: pending/paid/overdue/partial. `isOverdue()`, `getRemainingAttribute`. |
| `Evaluation.php` | `evaluations` | belongsTo `Asset`, `MarketSnapshot`, `onlineEvaluator`, `offlineEvaluator`; hasMany `EvaluatorReport`; hasOne `onlineReport`, `offlineReport` (filtered by layer) | `range_min/max`, `final_value:decimal:2`, `owner_decision:bool`, `owner_decided_at:datetime`, `alerts:array` | Status constants: PENDING_ONLINE / PENDING_OWNER / PENDING_OFFLINE / CONSOLIDATED / ABORTED. |
| `EvaluatorReport.php` | `evaluator_reports` | belongsTo `Evaluation`, `evaluator` (User) | many decimal/bool, `visual_condition/movement_condition/scores:array`, `submitted_at:datetime` | Grade table (mint/ex/vg/g/f → 100/88/72/55/35%). `SET_BONUS` for box/papers/full. `setBonusPercent()`. |
| `EvaluatorScore.php` | `evaluator_scores` | belongsTo `User` | `current_score:decimal:2`, `tier:int`, `total_reports:int`, `history:array` | Static `computeTier(float)` from `config('garantifi.scoring.tiers')`. `tierColor()`. |
| `MarketSnapshot.php` | `market_snapshots` | belongsTo `Asset` | many decimal:2, `listings_count:int`, `sources/raw:array`, `captured_at:datetime` | `isInsufficient()` flags trend=='insufficient' OR listings<min. |
| `MarketConfig.php` | `market_config` (explicit) | — | `brl_factor:decimal:4` | Static `factorFor(brand, family=null)` falls back to brand-only then 1.0. |
| `OnchainEvent.php` | `onchain_events` (no timestamps) | — | `payload:array`, `slot:int`, `occurred_at:datetime` | Unique index on `(signature, event_name)` via migration `2026_05_04_000001_fix_onchain_events_signature_unique`. |
| `BrzPriceReading.php` | `brz_price_readings` (no timestamps) | — | decimals + `read_at:datetime` | Append-only history of BRZ depeg readings. |
| `CronRun.php` | `cron_runs` (no timestamps) | — | `ran_at:datetime` | Audit row written by every artisan cron command. |

---

## 5. Middleware (`site/app/Http/Middleware/`)

| File | Purpose | Applied via |
|---|---|---|
| `TrustProxies.php` | Stock Laravel proxy trust. | Global stack. |
| `PreventRequestsDuringMaintenance.php` | Stock maintenance gate. | Global stack. |
| `TrimStrings.php` | Trim input strings. | Global stack. |
| `TrustHosts.php` | Defined but commented out at Kernel:17. | — |
| `EncryptCookies.php` | Stock cookie encryption. | `web` group. |
| `VerifyCsrfToken.php` | Standard CSRF + override: skip when `?token=` matches `DEMO_MAGIC_TOKEN`. | `web` group. |
| `PartitionSessionCookie.php` | Rewrites the session `Set-Cookie` to append `; Partitioned` when `session.same_site=none` + `session.secure=true`. Symfony 5.x doesn't support CHIPS natively; this hand-emits the header. MUST be first in `web` group so its `after` runs last. | `web` group (first). |
| `DemoTokenAuthenticator.php` | If `?token=DEMO_MAGIC_TOKEN`, calls `Auth::onceUsingId($demoUser)` — stateless, no session write. `?as=admin`/`borrower` or path-prefix auto-pick. Token-wins-always over an existing session. | `web` group (after StartSession, before CSRF). |
| `Authenticate.php` | Stock; redirects to `login` route on unauthenticated web. | `auth` alias. |
| `RedirectIfAuthenticated.php` | If authenticated, redirect admin → `admin.dashboard` else `borrower.dashboard`. | `guest` alias. |
| `AdminMiddleware.php` | Abort 403 unless `auth()->user()->isAdmin()`. | `admin` alias. |
| `EvaluatorOnlineMiddleware.php` | 403 unless `isEvaluatorOnline()` or `isAdmin()`. | `evaluator.online` alias. |
| `EvaluatorOfflineMiddleware.php` | 403 unless `isEvaluatorOffline()` or `isAdmin()`. | `evaluator.offline` alias. |
| `EvaluatorAnyMiddleware.php` | 403 unless any evaluator role or admin. | `evaluator.any` alias. |
| `NoStoreOnAuth.php` | Adds `Cache-Control: no-store, …` + `X-Vaulx-NoStore: 1` on responses; defeats nginx fastcgi_cache 419s on login. | `auth.nocache` alias. |

---

## 6. Jobs / events / listeners / observers

**None.** `site/app/` has no `Jobs/`, `Events/`, `Listeners/`, or `Observers/` directories. The only event-listener wiring is the framework default `Registered → SendEmailVerificationNotification` in `Providers/EventServiceProvider.php`.

Behavioural workflow is driven by:
- **Notifications** (§7) — fired inline from controllers.
- **Console commands** (§8.2) — scheduled crons.
- **Bridge webhooks** (`Api\BridgeWebhookController`) — inbound on-chain events.

---

## 7. Notifications (`site/app/Notifications/`)

All use `Queueable` trait but are dispatched synchronously via `Notifiable::notify` from controllers / commands. Each has `via() = ['mail','database']`.

| File | Triggered by | Recipient | Email gist |
|---|---|---|---|
| `AssetEvaluated.php` | `AdminController::approveEvaluation` | Asset owner | "Your asset is appraised — request a loan." |
| `EvaluationAssigned.php` | (defined but no caller in tree) | Assigned evaluator | "You have a new {layer} report." |
| `LoanApproved.php` | `AdminController::approveCustody` | Borrower | "Loan {code} active — disbursed." |
| `LoanCompleted.php` | `BorrowerController::payInstallment` (final installment) | Borrower | "Loan repaid, asset released, ready to re-loan." |
| `LoanOverdue.php` | `MarkOverdueCommand` | Borrower | "Loan is overdue, late fees accruing." |
| `OfflineReportCompleted.php` | `EvaluatorController::submitOffline` | Asset owner + all admins | "Evaluation consolidated." |
| `OnlineReportCompleted.php` | `EvaluatorController::submitOnline` | Asset owner | "Online report ready, decide on the range." |
| `ReengagementOffer.php` | `ReengagementCommand` | Borrower (asset owner) | "It's been N days since you repaid — re-loan." |
| `SuspiciousAlignmentDetected.php` | `EvaluatorController::submitOffline` (when `TriangleValidator` flags) | All admins | "Online/offline converge but both far from market." |
| `TripleConvergenceBonus.php` | `EvaluatorController::submitOffline` (when `TriangleValidator` flags) | Online + offline evaluators | "+N reputation points." |

---

## 8. Services + commands

### 8.1 Services (`site/app/Services/`)

| File | Public API | Bind |
|---|---|---|
| `SolanaBridge.php` | `health`, `readLoanConfig`, `readVault($assetMint)`, `readTrdcState($loanId)`, `readAccount($pda)`, `depositToVault`, `confirmCustodyAndDisburse($loanId)`, `createCcbTrdc(appraisalAtoms, loanAmountAtoms, termDays, rateBps)`, `payInstallment`, `renew`, `repay`, `issueSAS`, `executeDefault`. Every method returns normalized `['ok'=>bool,'status'=>int,...]`. HMAC-SHA256 over `${ts}\n${METHOD}\n${path}\n${body}`. | Singleton in `AppServiceProvider` (returns empty-config short-circuit when no shared secret). |
| `SolanaService.php` | `rpc`, `getBalance`, `getTokenAccountBalance`, `getSignaturesForAddress`, `getSlot`, `vaultSnapshot(symbol)`, `deriveVaultPda` (always returns null — stub), `explorerUrl`. | Singleton. |
| `CurrencyService.php` | `usdToBrl` (AwesomeAPI), `brzUsd` (Jupiter v6), `brzBrl`, `depegPercent`, `convertUsdToBrl`, `convertBrlToUsd`, `snapshot`, `forceRefresh`. Both rate fetches cached `garantifi.rates.cache_ttl` (default 300s). | Singleton. |
| `InterestCalculator.php` | Static: `simpleInterest`, `interestForMonths`, `lateFee`, `totalDue`, `linearSchedule(principal, annualBps, months)`. | — |
| `ScoringService.php` | Static: `computeM1`, `computeM6`, `weightedFinal`, `consolidate(Evaluation)`, `updateEvaluatorScore`. Updates `Evaluation.status` → `consolidated` + `final_value` + per-report `scores` + per-evaluator running history (last 50). | — |
| `TriangleValidator.php` | Static `analyze($m1, $m6Online, $m6Offline, $median, $listings)` → `[alerts, bonusPts]`. Alerts: `unstable_market`, `suspicious_alignment`, `unilateral_deviation`, `triple_convergence`. | — |
| `MarketPriceService.php` | `snapshotForAsset(Asset)` → `MarketSnapshot|null`, `fetch(refNumber)` with 1h cache, internal `resolveSource` falls back to stub when `garantifi.features.market_api_real=false`. Real API path raises (TODO). | Singleton. |
| `MarketSources/StubMarketSource.php` | `fetch(refNumber)` deterministic via `crc32($ref)` → median $3k–$25k, spread 12–36%, 3–42 listings, trend stable/rising/falling/insufficient. | — |

There is no `app/Actions/` directory.

### 8.2 Artisan commands (`site/app/Console/Commands/`)

Scheduled in `Console/Kernel.php`:

| Command | Signature | Schedule | What it does |
|---|---|---|---|
| `MarkOverdueCommand` | `garantifi:mark-overdue [--dry]` | hourly | Loans with `due_date<today` AND status=active → status=overdue; persists `OnchainEvent('MarkOverdue')` + `CronRun`; sends `LoanOverdue` notification. |
| `CaptureBrzRateCommand` | `garantifi:capture-brz-rate` | every 5 min | Forces refresh, persists `BrzPriceReading` with tier classification (normal/alert/paused/convert). |
| `WatchOnchainEventsCommand` | `garantifi:watch-events [--limit=20]` | every minute | `SolanaService::getSignaturesForAddress(GF_LOAN_PROGRAM_ID)`; inserts new sigs as `OnchainEvent`. |
| `ReengagementCommand` | `garantifi:reengagement [--dry]` | daily 10:00 | Targets loans repaid exactly N days ago (config), no open loan, appraisal still valid → send `ReengagementOffer`. Gated by `garantifi.features.reengagement_drip`. |
| `CaptureMarketSnapshotCommand` | `garantifi:capture-market-snapshot [--max-age-hours=24]` | every 15 min | For evaluations in pending_online/owner/offline with missing or stale `MarketSnapshot`, call `MarketPriceService::snapshotForAsset`. |
| `DemoSeedCommand` | `demo:seed` | (manual; invoked by `POST /api/demo/reset`) | Idempotent: wipes & re-creates `demo-borrower@vaulx.fi` + `demo-admin@vaulx.fi` + asset 47 (Rolex Submariner) + loan 47 (pending_custody). |

### 8.3 Support (`site/app/Support/`)

| File | Purpose |
|---|---|
| `Base58.php` | Pure-PHP Bitcoin-alphabet base58 encoder/decoder, mirrors `StephenHill\Base58` API. Used by `SiwsController`, `ProfileController`, `Loan::deriveDeterministicSolanaLoanId`. |
| `AssetStatusGuide.php` | Pure functions over an `Asset`: `for(asset)`, `currentStep(asset)`, `journey(asset)`. Drives the borrower-side asset timeline / next-step badges. |

### 8.4 Providers (`site/app/Providers/`)

| File | Bindings / hooks |
|---|---|
| `AppServiceProvider.php` | Singletons for `CurrencyService`, `SolanaService`, `MarketPriceService`, `SolanaBridge`. `View::composer('*')` shares `gfNetwork`, `gfTokens` into every view. |
| `AuthServiceProvider.php` | Stock — no policies registered. |
| `BroadcastServiceProvider.php` | Loads `routes/channels.php`. |
| `EventServiceProvider.php` | Only `Registered → SendEmailVerificationNotification`. |
| `RouteServiceProvider.php` | Loads web + api routes. Rate limiter `api` = 60/min keyed by user id or IP. `HOME='/home'` constant is defined but the route doesn't exist (dead). |
| `ViteServiceProvider.php` | Custom `@vite(...)` directive — reads `public/hot` for dev HMR or `public/build/manifest.json` for prod, emits `<script>`/`<link>` tags. Replaces the official `laravel/vite-plugin` because this project still runs on Laravel 8. |

---

## 9. Config files of interest (`site/config/`)

Stock files left untouched: `app.php`, `auth.php`, `broadcasting.php`, `cache.php`, `cors.php`, `database.php`, `filesystems.php`, `hashing.php`, `logging.php`, `mail.php`, `queue.php`, `sanctum.php`, `services.php`, `session.php`, `view.php`.

Custom files:

### 9.1 `config/garantifi.php`

Holds every protocol parameter. Keys (env-overridable where shown):

- `network`, `rpc_url`, `explorer_url` — `GF_NETWORK`, `GF_RPC_URL`, `GF_EXPLORER_URL`.
- `tokens.USDC`, `tokens.BRZ` — mint, decimals, symbol/prefix.
- `programs.vault`, `programs.loan` — anchor program ids.
- `features.{anchor_ready, real_cnft, notifications, market_api_real, evaluation_v12, reloan, reengagement_drip}`.
- `reloan.{max_appraisal_age_days, reengagement_offer_days}`.
- `lending.max_ltv_pct` — default 60; aligned with on-chain `MAX_LTV_BPS=6_000`.
- `scoring.weights` (m1=30, m2=20, m3=15, m4=15, m5=10, m6=10), `m6_thresholds/scores`, `m1_thresholds/scores`, `convergence_bonus=5`, `suspicious_alignment_threshold=20`, `tiers={1=>0,2=>60,3=>75,4=>90}`.
- `market.{sources, cache_ttl, min_listings, urls.*, keys.*}`.
- `interest.{annual_bps=2400, late_fee_bps_monthly=150, origination_fee_bps=250}`.
- `rates.{source, cache_ttl, fallback_brl_usd}`.
- `jupiter.price_url`.
- `depeg.{alert_pct=1.0, pause_pct=3.0, convert_pct=5.0}`.

### 9.2 `config/solana_bridge.php`

- `base_url` (`SOLANA_BRIDGE_BASE_URL`, default `http://127.0.0.1:8787`).
- `shared_secret` (`SOLANA_BRIDGE_SHARED_SECRET`, no default — empty = bridge calls short-circuit `ok:false`).
- `timeout_seconds` (default 30).
- `demo_asset_mint` (`SOLANA_BRIDGE_DEMO_ASSET_MINT`, falls back to `GF_USDC_MINT` so wallet UI and bridge see the same mint).

### 9.3 `config/squads.php`

Off-chain snapshot of the Squads Protocol multisig (mirror of `vaulx-protocol/scripts/dev/squads-multisig.json`). Keys: `cluster`, `multisig_pda`, `vault_pda`, `threshold`, `created_at`, `creation_tx`, `members[]` (label/role/pubkey/wallet_type/icon). Read only by `/admin/multisig`.

---

## 10. Database migrations (context only — schema authority)

22 migrations under `site/database/migrations/`. The non-stock ones reveal the timeline:

```
2026_04_13_000001_add_garantifi_fields_to_users_table.php   wallet_address, address, is_active, cpf_cnpj, phone, role
2026_04_13_000002_create_assets_table.php
2026_04_13_000003_create_loans_table.php
2026_04_13_000004_create_loan_payments_table.php
2026_04_13_000005_add_evaluation_statuses_to_assets_table.php
2026_04_23_000001_create_brz_price_readings_table.php
2026_04_23_000002_create_onchain_events_table.php
2026_04_24_003133_create_notifications_table.php           framework table (database channel)
2026_04_24_010000_add_siws_to_users_table.php              solana_pubkey, auth_provider
2026_04_24_020001_add_reference_number_video_to_assets.php
2026_04_24_020002_expand_user_role_enum.php                evaluator_online, evaluator_offline
2026_04_24_020003_create_market_snapshots_table.php
2026_04_24_020004_create_evaluations_table.php
2026_04_24_020005_create_evaluator_reports_table.php
2026_04_24_020006_create_evaluator_scores_table.php
2026_04_24_020007_create_market_config_table.php
2026_05_03_000001_add_solana_fields_to_loans_table.php     solana_loan_id, confirm_custody_tx
2026_05_04_000001_fix_onchain_events_signature_unique.php  composite unique (signature, event_name)
```

---

## 11. Surfaces summary (port priority)

| Surface | Routes | Controllers | Views | Models touched | External integrations |
|---|---|---|---|---|---|
| **Public** | `/`, `/simulator`, `/terms`, `/faq`, `/team`, `/csrf-fresh` | `HomeController` | `home`, `simulator`, `terms`, `faq`, `team` | (none persisted) | Solana bridge reads |
| **Auth** | `/login`, `/register`, `/logout`, `/forgot-password`, `/reset-password/*`, `/auth/siws/*`, `/demo` | `AuthController`, `PasswordResetController`, `Api\SiwsController`, `DemoSessionController` | `auth/*` | `User` | Mail, ed25519 sodium, demo token |
| **Borrower** | `/dashboard/*` | `BorrowerController` (+ `ProfileController`, `OwnerDecisionController`) | `borrower/*`, `profile`, `owner/evaluation/range` | `Asset`, `Loan`, `LoanPayment`, `Evaluation`, `MarketSnapshot`, `OnchainEvent` | `MarketPriceService`, `SolanaBridge::createCcbTrdc`, mail |
| **Evaluator** | `/evaluator/*` | `EvaluatorController` | `evaluator/*` | `Evaluation`, `EvaluatorReport`, `EvaluatorScore` | `ScoringService`, `TriangleValidator`, mail |
| **Owner decision** | `/evaluation/{asset}/range`, `/evaluation/{asset}/decide` | `OwnerDecisionController` | `owner/evaluation/range` | `Asset`, `Evaluation` | — |
| **Admin** | `/admin/*` | `AdminController`, `SuperAdminController` | `admin/*` | all | `SolanaBridge::confirmCustodyAndDisburse`, mail, Squads config |
| **API** | `/api/rates*`, `/api/vaults`, `/api/onchain/*`, `/api/user` | `Api\RatesController`, `Api\VaultsController`, `Api\EventsController` | (JSON only) | `BrzPriceReading`, `OnchainEvent`, `CronRun` | `CurrencyService`, `SolanaBridge::readVault`, `SolanaService` RPC |
| **Webhooks** | `POST /api/onchain-events/{event}`, `POST /api/demo/reset` | `Api\BridgeWebhookController`, `DemoSessionController` | (JSON) | `OnchainEvent` | HMAC-SHA256, Artisan invocation |

---

## 12. Questions / anomalies

1. **Dead route reference: `borrower.assets.index`.** `OfflineReportCompleted.php:34` builds a `route('borrower.assets.index')` — no such name is registered in `routes/web.php`. The borrower index of assets is rendered inline on `borrower.dashboard`. This notification email will throw a `RouteNotFoundException` at render time for non-owner notifiables.
2. **Unused controller methods.** `EvaluatorController::onlineLegacy()` and `offlineLegacy()` exist but no route references them; the `online()`/`offline()` index actions immediately redirect to the unified dashboard. Either delete or wire to the legacy views (`evaluator/online/dashboard.blade.php`, `evaluator/offline/dashboard.blade.php`).
3. **Dead view: `welcome.blade.php`.** Stock Laravel scaffolding view; replaced by `home.blade.php`. No route renders it.
4. **`EvaluationAssigned` notification has no caller.** Defined in `app/Notifications/EvaluationAssigned.php`; no controller, service, or command dispatches it. Either dispatch from `SuperAdminController::assignEvaluation` (the obvious site) or remove.
5. **`RouteServiceProvider::HOME='/home'` is dead.** No `/home` route exists; both auth flows hard-code `borrower.dashboard` / `admin.dashboard`. Constant can be deleted in the port.
6. **`SuperAdminController` is gated by `admin` only.** `User::isSuperAdmin()` aliases to `isAdmin()` (User.php:65-68). There is no separate role tier in the schema. Either remove the "Super Admin" framing or add a tier in the port (Next.js spec decision).
7. **`SolanaService::deriveVaultPda` always returns null.** Stub that the legacy `vaultSnapshot()` falls back through. The live vault path is now `SolanaBridge::readVault` (used by `VaultsController` + admin/home cache). The `vaultSnapshot()` method is effectively dead; `getBalance`, `getTokenAccountBalance` are unreferenced from controllers (only `getSlot` + `getSignaturesForAddress` + `explorerUrl` remain in use). Port can drop most of `SolanaService`.
8. **Duplicate base58 implementation.** `Loan::base58Encode` exists as a "fallback in case autoload misbehaves" alongside `App\Support\Base58`. Defensive copy; can collapse to one in the port.
9. **Notifications shape uses queue trait but is dispatched sync.** Every notification uses `Queueable` but they're sent via `Notifiable::notify($notification)` not `notifyNow($notification)` — Laravel still runs them sync unless `ShouldQueue` is implemented. Trait without contract is a no-op. Either implement `ShouldQueue` and wire a queue driver, or strip the trait.
10. **`Sanctum stateful middleware is disabled** (Kernel.php:56 commented out). `/api/user` exists with `auth:sanctum` but no front-end currently calls it. If the Next.js app needs session-cookied API access from the Laravel SPA, this needs to be re-enabled or the port skips Sanctum entirely.
11. **`Asset::CUSTODY_STATUSES` includes `with_owner` and `in_transit`** but no controller transitions to those statuses — only `pending_evaluation`, `evaluated`, `in_custody`, `released` are set programmatically. The `AssetStatusGuide` handles them defensively. Port can either narrow the enum or add the transitions.
12. **`OnchainEvent::firstOrCreate` with no signature** (BridgeWebhookController.php:106) — when a webhook arrives without a `signature` field in the JSON body, `firstOrCreate({}, $attributes)` matches the first row in the table, which means subsequent signatureless events of the same name silently no-op. Either reject signatureless payloads up front (preferred) or fall back to a unique key per request.
13. **`File uploads land in `public_path('upload/product')` and `public/upload/video`.** Direct public-disk writes with no cleanup; orphan files survive asset soft-deletes. Port should route through Laravel's filesystem driver or (in Next.js) S3 / Supabase Storage.
14. **`Hardcoded interest constants in `BorrowerController::storeLoan`.** `interestRate=24.00`, `originationFeePct=2.50` are inlined despite `config/garantifi.php:106-108` defining `interest.annual_bps` and `interest.origination_fee_bps`. Port should treat config as the source of truth.
15. **`Demo-borrower default email derivation in `SiwsController::verify`** assigns `email = "{pubkey}@siws.vaulx.local"` for auto-created users. That's fine for a unique constraint, but renders weirdly in the admin user list and breaks email-sending paths if the bridge ever calls Laravel's notification system for those users.

---

```
STATUS: shipped
What landed:
- Full Laravel inventory at docs/plans/inventory/01-laravel-inventory.md
- 8 web-route surfaces + 8 API routes documented with verb/path/controller/middleware/name
- 11 controllers (8 web + 3 API helpers) catalogued with public methods + deps
- 37 Blade views grouped by Public/Auth/Borrower/Evaluator/Owner/Admin + 16 components
- 12 Eloquent models with table/relationships/casts/scopes
- 15 middleware (incl. CHIPS partitioned-cookie + demo-token bypass)
- 10 notifications + 6 artisan commands + 8 services + 2 support helpers + 6 providers
- 3 custom config files (garantifi, solana_bridge, squads) summarised
- 15 anomalies / dead code / port-time decisions flagged
What's blocked: none
What's next: architect can now draft per-surface port specs (recommend starting with Auth + Borrower since they're the load-bearing flows; Admin can land last)
```
