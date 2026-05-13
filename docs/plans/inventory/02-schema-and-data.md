# 02 — Schema and Data Inventory

Scope: map the data model that Laravel (`site/`) creates and that Next.js
(`apps/web/`) is expected to share via Supabase Postgres during parallel-run.

Sources read (all under `/Users/gogy/MyCODE/VAULX/`):

- `site/database/migrations/*.php` (22 files)
- `site/database/seeders/*.php` (5 files)
- `site/database/factories/UserFactory.php` (only factory)
- `site/app/Models/*.php` (12 models)
- `supabase/migrations/*.sql` (1 file)
- `apps/web/src/lib/**` and `apps/web/src/app/api/**` for Next-side reads/writes
- `packages/supabase/src/server.ts` (admin/anon client construction)

Read-only pass. No code touched.

---

## Section A — Canonical schema (final shape after all migrations)

Conventions: types are listed using the Laravel/Postgres equivalent. Laravel
`enum()` columns become Postgres `varchar` with a CHECK constraint when the
schema is materialised on Postgres (see Drift, Section C) — the values listed
under "enum" are still the legal set of values the app code expects.

### users
Created by `2014_10_12_000000_create_users_table.php`, extended by
`2026_04_13_000001_add_garantifi_fields_to_users_table.php`,
`2026_04_24_010000_add_siws_to_users_table.php` and
`2026_04_24_020002_expand_user_role_enum.php`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK (autoinc) | no | — | |
| name | varchar | no | — | |
| email | varchar | no | — | UNIQUE |
| role | enum | no | `borrower` | one of `borrower`, `admin`, `evaluator_online`, `evaluator_offline` |
| cpf_cnpj | varchar(18) | yes | null | UNIQUE; Brazilian taxpayer ID |
| phone | varchar(20) | yes | null | |
| wallet_address | varchar(44) | yes | null | legacy column; pre-SIWS |
| solana_pubkey | varchar(44) | yes | null | UNIQUE; SIWS auth identity |
| auth_provider | varchar(16) | no | `email` | `email` \| `solana` |
| address | text | yes | null | |
| is_active | boolean | no | true | |
| email_verified_at | timestamp | yes | null | |
| password | varchar | no | — | bcrypt hash |
| remember_token | varchar(100) | yes | null | Laravel auth |
| created_at | timestamp | yes | null | |
| updated_at | timestamp | yes | null | |

Indexes/Uniques: `users_email_unique`, `users_cpf_cnpj_unique`, `users_solana_pubkey_unique`.

### password_resets
`2014_10_12_100000_create_password_resets_table.php`.

| Column | Type | Null | Default |
|---|---|---|---|
| email | varchar | no | — |
| token | varchar | no | — |
| created_at | timestamp | yes | null |

Index: `email` (non-unique).

### failed_jobs
`2019_08_19_000000_create_failed_jobs_table.php`.

| Column | Type | Null | Default |
|---|---|---|---|
| id | bigint PK | no | — |
| uuid | varchar | no | — |
| connection | text | no | — |
| queue | text | no | — |
| payload | longtext | no | — |
| exception | longtext | no | — |
| failed_at | timestamp | no | CURRENT_TIMESTAMP |

Uniques: `uuid`.

### personal_access_tokens
`2019_12_14_000001_create_personal_access_tokens_table.php`. Laravel Sanctum.

| Column | Type | Null | Default |
|---|---|---|---|
| id | bigint PK | no | — |
| tokenable_type | varchar | no | — |
| tokenable_id | bigint | no | — |
| name | varchar | no | — |
| token | varchar(64) | no | — |
| abilities | text | yes | null |
| last_used_at | timestamp | yes | null |
| created_at | timestamp | yes | null |
| updated_at | timestamp | yes | null |

Indexes: `personal_access_tokens_token_unique`, morph index `(tokenable_type, tokenable_id)`.

### assets
`2026_04_13_000002_create_assets_table.php`, extended by
`2026_04_13_000005_add_evaluation_statuses_to_assets_table.php` (enum widening)
and `2026_04_24_020001_add_reference_number_video_to_assets.php`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK | no | — | |
| user_id | bigint FK→users.id | no | — | ON DELETE CASCADE |
| category | enum | no | — | `watch` \| `jewelry` \| `art` \| `vehicle` |
| brand | varchar | yes | null | |
| model | varchar | yes | null | |
| reference_number | varchar(64) | yes | null | indexed |
| serial_number | varchar | yes | null | |
| description | text | no | — | |
| year | year | yes | null | |
| condition | varchar(20) | no | `excellent` | `excellent` \| `good` \| `fair` (free string) |
| estimated_value | decimal(15,2) | no | — | |
| appraised_value | decimal(15,2) | yes | null | |
| appraiser | varchar | yes | null | |
| appraisal_date | date | yes | null | |
| custody_status | enum | no | `pending_evaluation` | `pending_evaluation` \| `evaluated` \| `with_owner` \| `in_transit` \| `in_custody` \| `released` |
| custody_location | varchar | yes | null | |
| custody_received_at | timestamp | yes | null | |
| nft_mint_address | varchar(44) | yes | null | mocked on devnet |
| metadata_uri | varchar | yes | null | |
| mint_tx_hash | varchar(88) | yes | null | mocked on devnet |
| photo_urls | json | yes | null | array of URLs |
| video_url | varchar | yes | null | |
| created_at | timestamp | yes | null | |
| updated_at | timestamp | yes | null | |
| deleted_at | timestamp | yes | null | soft-delete |

Indexes: `(user_id, category)`, `custody_status`, `reference_number`, FK on `user_id`.

### loans
`2026_04_13_000003_create_loans_table.php`, extended by
`2026_05_03_000001_add_solana_fields_to_loans_table.php`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK | no | — | |
| code | varchar(20) | no | — | UNIQUE; pattern `GF-YYYY-NNNNN` |
| user_id | bigint FK→users.id | no | — | ON DELETE CASCADE |
| asset_id | bigint FK→assets.id | no | — | ON DELETE CASCADE |
| approved_by | bigint FK→users.id | yes | null | ON DELETE SET NULL |
| status | enum | no | `pending_custody` | `pending_custody` \| `active` \| `overdue` \| `defaulted` \| `repaid` |
| asset_value | decimal(15,2) | no | — | snapshot at approval |
| ltv_percent | decimal(5,2) | no | — | 50–60 |
| principal | decimal(15,2) | no | — | disbursed amount |
| interest_rate | decimal(5,2) | no | — | annual % |
| origination_fee_percent | decimal(5,2) | no | 2.50 | |
| origination_fee | decimal(15,2) | no | — | absolute |
| liquidation_fee_percent | decimal(5,2) | no | 5.00 | |
| term_months | int | no | — | |
| start_date | date | yes | null | |
| due_date | date | yes | null | indexed |
| total_repaid | decimal(15,2) | no | 0 | |
| outstanding_balance | decimal(15,2) | no | 0 | |
| currency | enum | no | `USDC` | `USDC` \| `BRZ` |
| escrow_address | varchar(44) | yes | null | |
| solana_loan_id | varchar(64) | yes | null | base58 32-byte pubkey; indexed |
| disbursement_tx_hash | varchar(88) | yes | null | legacy mock; pre-bridge |
| confirm_custody_tx | varchar(128) | yes | null | real bridge tx signature |
| repayment_tx_hash | varchar(88) | yes | null | |
| approved_at | timestamp | yes | null | |
| disbursed_at | timestamp | yes | null | |
| repaid_at | timestamp | yes | null | |
| defaulted_at | timestamp | yes | null | |
| admin_notes | text | yes | null | |
| created_at | timestamp | yes | null | |
| updated_at | timestamp | yes | null | |
| deleted_at | timestamp | yes | null | soft-delete |

Indexes: `loans_code_unique`, `(user_id, status)`, `status`, `due_date`,
`solana_loan_id`, FKs on `user_id`, `asset_id`, `approved_by`.

### loan_payments
`2026_04_13_000004_create_loan_payments_table.php`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK | no | — | |
| loan_id | bigint FK→loans.id | no | — | ON DELETE CASCADE |
| installment_number | int | no | — | 1..term_months |
| amount_due | decimal(15,2) | no | — | |
| principal_portion | decimal(15,2) | no | — | |
| interest_portion | decimal(15,2) | no | — | |
| amount_paid | decimal(15,2) | no | 0 | |
| due_date | date | no | — | indexed |
| paid_at | date | yes | null | |
| status | enum | no | `pending` | `pending` \| `paid` \| `overdue` \| `partial` |
| tx_hash | varchar(88) | yes | null | mocked on devnet |
| created_at | timestamp | yes | null | |
| updated_at | timestamp | yes | null | |

Indexes: `(loan_id, status)`, `due_date`, FK on `loan_id`.

### brz_price_readings
`2026_04_23_000001_create_brz_price_readings_table.php`. Append-only oracle log.

| Column | Type | Null | Default |
|---|---|---|---|
| id | bigint PK | no | — |
| brz_usd | decimal(12,6) | no | — |
| usd_brl | decimal(10,4) | no | — |
| brz_brl | decimal(10,6) | no | — |
| depeg_pct | decimal(6,4) | no | — |
| tier | varchar(20) | no | `normal` |
| read_at | timestamp | no | CURRENT_TIMESTAMP |

Indexes: `read_at`, `tier`. No Laravel `timestamps()` (model sets
`public $timestamps = false`).

### onchain_events
`2026_04_23_000002_create_onchain_events_table.php`, amended by
`2026_05_04_000001_fix_onchain_events_signature_unique.php`.
Final shape (Laravel):

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK | no | — | |
| event_name | varchar(64) | no | — | indexed |
| signature | varchar(128) | yes | null | tx signature |
| slot | unsigned bigint | yes | null | indexed |
| program_id | varchar(64) | yes | null | |
| payload | json | yes | null | |
| occurred_at | timestamp | no | CURRENT_TIMESTAMP | indexed |

Unique: composite `onchain_events_sig_evt_unique` on `(signature, event_name)`
— the original column-level unique on `signature` was dropped (broke the
multi-event-per-tx case where one tx emits e.g. `CcbTrdcCreated` and
`TrdcStateInitialized`).

**Note**: the Supabase migration at `supabase/migrations/20260425000000_onchain_events.sql`
creates a divergent shape — see Section C.

### cron_runs
Same migration as `onchain_events`. Job-run audit log.

| Column | Type | Null | Default |
|---|---|---|---|
| id | bigint PK | no | — |
| name | varchar(64) | no | — |
| scanned | int | no | 0 |
| affected | int | no | 0 |
| status | varchar(20) | no | `ok` |
| notes | text | yes | null |
| ran_at | timestamp | no | CURRENT_TIMESTAMP |

Index: `name`. No Laravel `timestamps()`.

### notifications
`2026_04_24_003133_create_notifications_table.php`. Standard Laravel polymorphic
notification table.

| Column | Type | Null | Default |
|---|---|---|---|
| id | uuid PK | no | — |
| type | varchar | no | — |
| notifiable_type | varchar | no | — |
| notifiable_id | bigint | no | — |
| data | text | no | — |
| read_at | timestamp | yes | null |
| created_at | timestamp | yes | null |
| updated_at | timestamp | yes | null |

Morph index on `(notifiable_type, notifiable_id)`.

### market_snapshots
`2026_04_24_020003_create_market_snapshots_table.php`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK | no | — | |
| asset_id | bigint FK→assets.id | no | — | ON DELETE CASCADE |
| reference_number | varchar(64) | no | — | indexed |
| median_usd | decimal(12,2) | no | — | |
| min_usd | decimal(12,2) | no | — | |
| max_usd | decimal(12,2) | no | — | |
| listings_count | unsigned int | no | — | |
| trend | varchar(16) | no | `stable` | `rising` \| `falling` \| `stable` \| `insufficient` |
| brl_factor | decimal(6,4) | no | 1.0 | |
| sources | json | yes | null | |
| raw | json | yes | null | |
| captured_at | timestamp | no | CURRENT_TIMESTAMP | |
| created_at | timestamp | yes | null | |
| updated_at | timestamp | yes | null | |

Indexes: `reference_number`, `(asset_id, captured_at)`, FK on `asset_id`.

### evaluations
`2026_04_24_020004_create_evaluations_table.php`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK | no | — | |
| asset_id | bigint FK→assets.id | no | — | UNIQUE; ON DELETE CASCADE |
| market_snapshot_id | bigint FK→market_snapshots.id | yes | null | |
| online_evaluator_id | bigint FK→users.id | yes | null | |
| offline_evaluator_id | bigint FK→users.id | yes | null | |
| status | varchar(32) | no | `pending_online` | `pending_online` → `pending_owner_decision` → `pending_offline` → `consolidated` → `aborted` |
| range_min | decimal(12,2) | yes | null | |
| range_max | decimal(12,2) | yes | null | |
| owner_decision | boolean | yes | null | |
| owner_decided_at | timestamp | yes | null | |
| final_value | decimal(12,2) | yes | null | |
| alerts | json | yes | null | |
| created_at | timestamp | yes | null | |
| updated_at | timestamp | yes | null | |

Indexes: `status`, `evaluations_asset_id_unique`, FKs on the four refs.

### evaluator_reports
`2026_04_24_020005_create_evaluator_reports_table.php`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK | no | — | |
| evaluation_id | bigint FK→evaluations.id | no | — | ON DELETE CASCADE |
| evaluator_id | bigint FK→users.id | no | — | |
| layer | varchar(16) | no | — | `online` \| `offline` |
| value_usd | decimal(12,2) | no | — | |
| grade | varchar(8) | no | — | `mint` \| `ex` \| `vg` \| `g` \| `f` |
| has_box | boolean | no | false | |
| has_papers | boolean | no | false | |
| visual_condition | json | yes | null | online-only |
| replica_signs | boolean | no | false | online-only |
| caliber | varchar(32) | yes | null | offline-only |
| serial_match | boolean | yes | null | offline-only |
| movement_condition | json | yes | null | offline-only |
| authenticity | varchar(16) | yes | null | offline-only; `authentic` \| `suspect` \| `replica` |
| timing_rate | decimal(6,2) | yes | null | offline-only |
| scores | json | yes | null | scoring snapshot |
| submitted_at | timestamp | yes | null | |
| created_at | timestamp | yes | null | |
| updated_at | timestamp | yes | null | |

Indexes: unique `(evaluation_id, layer)`, `evaluator_id`, FKs.

### evaluator_scores
`2026_04_24_020006_create_evaluator_scores_table.php`.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint PK | no | — | |
| user_id | bigint FK→users.id | no | — | ON DELETE CASCADE |
| layer | varchar(16) | no | — | `online` \| `offline` |
| current_score | decimal(5,2) | no | 0 | |
| tier | unsigned tinyint | no | 1 | 1..4 |
| total_reports | unsigned int | no | 0 | |
| history | json | yes | null | |
| created_at | timestamp | yes | null | |
| updated_at | timestamp | yes | null | |

Unique: `(user_id, layer)`.

### market_config
`2026_04_24_020007_create_market_config_table.php`. Custom table name (model
sets `$table = 'market_config'`).

| Column | Type | Null | Default |
|---|---|---|---|
| id | bigint PK | no | — |
| brand | varchar(64) | no | — |
| family | varchar(64) | yes | null |
| brl_factor | decimal(6,4) | no | 1.0 |
| notes | varchar | yes | null |
| created_at | timestamp | yes | null |
| updated_at | timestamp | yes | null |

Unique: `(brand, family)`.

### Supabase-only objects

- **`onchain_events`** is also created by
  `supabase/migrations/20260425000000_onchain_events.sql` with a divergent
  shape (see Section C).
- **`ccb-pdfs`** — a Supabase Storage bucket referenced by
  `apps/web/src/lib/chain/ccb-storage.ts:19`. No SQL migration defines it; it
  must be created manually in the Supabase dashboard or via a future
  storage-bucket migration.

No RLS policies are defined in the repo. The Next.js code uses
`SUPABASE_SERVICE_ROLE_KEY` (see `packages/supabase/src/server.ts:14` and
every `apps/web/src/app/api/.../route.ts`) — calls bypass RLS by design.

---

## Section B — Model ↔ table map

All in `site/app/Models/`.

| Model class | Backing table | Notes |
|---|---|---|
| `App\Models\User` | `users` | extends Authenticatable; Sanctum + Notifiable |
| `App\Models\Asset` | `assets` | SoftDeletes; `photo_urls` cast to array |
| `App\Models\Loan` | `loans` | SoftDeletes; `solana_loan_id` accessor derives from sha256+base58 when null |
| `App\Models\LoanPayment` | `loan_payments` | — |
| `App\Models\BrzPriceReading` | `brz_price_readings` | `$timestamps = false` |
| `App\Models\OnchainEvent` | `onchain_events` | `$timestamps = false`; uses `occurred_at` not `created_at` |
| `App\Models\CronRun` | `cron_runs` | `$timestamps = false` |
| `App\Models\Evaluation` | `evaluations` | hasMany reports |
| `App\Models\EvaluatorReport` | `evaluator_reports` | — |
| `App\Models\EvaluatorScore` | `evaluator_scores` | — |
| `App\Models\MarketSnapshot` | `market_snapshots` | — |
| `App\Models\MarketConfig` | `market_config` | explicit `$table = 'market_config'` (singular) |

Tables with **no Eloquent model**: `password_resets`, `failed_jobs`,
`personal_access_tokens`, `notifications`. All four are framework-managed
(Laravel auth, queue, Sanctum, notifications). They will be unused by Next.js.

---

## Section C — Supabase vs Laravel migration drift

The only authoritative Supabase migration in-tree is
`supabase/migrations/20260425000000_onchain_events.sql`. It creates a table
with the **same name** as the Laravel `onchain_events` table but a different
shape. Both apps query a table called `onchain_events` against the same
database, so drift here is load-bearing.

### `onchain_events` — divergence

| Concern | Laravel migration (final shape) | Supabase migration |
|---|---|---|
| PK | `id` bigint autoincrement | `id` uuid `default gen_random_uuid()` |
| `program_id` | varchar(64), nullable | text, **NOT NULL** |
| `event_name` | varchar(64), not null | text, not null |
| `payload` | json, **nullable** | jsonb, **NOT NULL** |
| `slot` | unsigned bigint, **nullable** | bigint, **NOT NULL** |
| `signature` | varchar(128), nullable | text, **not null + UNIQUE (single-column)** |
| Timestamp | `occurred_at` timestamp default `CURRENT_TIMESTAMP` | `created_at` timestamptz default `now()` |
| Unique constraint | composite `(signature, event_name)` | single-column `signature` |
| Indexes | `event_name`, `slot`, `occurred_at` | `event_name`, `(created_at desc)` |

Concrete consequences:

1. **PK type mismatch**: bigint vs uuid. Whichever side writes first wins; the
   other side will fail on insert because the column type and default differ.
2. **Single-column UNIQUE on `signature`**: the Laravel side explicitly fixed
   this in `2026_05_04_000001_fix_onchain_events_signature_unique.php` because
   one tx can emit multiple events. The Supabase DDL re-introduces the bug.
3. **`created_at` vs `occurred_at`**: Next.js queries `created_at` (e.g.
   `apps/web/src/app/api/auctions/route.ts:91-94`) while Laravel writes to
   `occurred_at`. If the Laravel-shape table is what actually exists on
   Supabase, every Next-side query that orders by `created_at` returns nothing
   useful and `select("payload, created_at, slot")` would fail.
4. **`payload` nullability**: Next-side handlers treat `payload` as required
   (`row.payload as Record<...>`), Laravel allows null.

Net: the Supabase migration is **stale relative to the Laravel side** and
either was never applied, or was applied to a different DB than Laravel runs
against. Treat the Laravel migration as the source of truth and write a new
Supabase migration that:
- uses bigint PK + autoinc (or rebases Laravel to uuid PKs),
- drops the single-column UNIQUE,
- adds composite `(signature, event_name)` UNIQUE,
- renames `created_at` → `occurred_at` (or vice-versa) consistently in both
  apps.

### Everything else
No other table has a Supabase migration. Every other Laravel table
(`users`, `assets`, `loans`, `loan_payments`, `evaluations`,
`evaluator_reports`, `evaluator_scores`, `market_snapshots`, `market_config`,
`brz_price_readings`, `cron_runs`, `notifications`, `password_resets`,
`failed_jobs`, `personal_access_tokens`) only exists in Postgres if
`php artisan migrate` has been pointed at the Supabase Postgres. Whether that
has happened is not deducible from the repo — `supabase/config.toml.example`
is the only config file checked in.

### `ccb-pdfs` storage bucket
Referenced by `apps/web/src/lib/chain/ccb-storage.ts:19` but no
`supabase/migrations` SQL or `storage_objects` policy creates it. Needs to be
provisioned out-of-band or codified.

---

## Section D — Read/write surface by app

"Laravel" means `site/app/...` reads/writes the table; "Next" means
`apps/web/src/...` reads/writes. Inferred from controllers, models, seeders,
and Next-side `lib/` + `api/` route handlers.

| Table | Laravel | Next | Notes |
|---|---|---|---|
| `users` | R/W (auth, profiles, evaluator roster) | none observed | Next has its own KYC/wallet model; no Supabase user table reads in `apps/web/src/lib/**` |
| `assets` | R/W | none observed | Next-side appraisal logic in `apps/web/src/lib/appraisal/` operates on its own types, not a Supabase `assets` table |
| `loans` | R/W (BorrowerController, AdminController, Api/VaultsController) | none observed | Next reads loan state from Solana via `apps/web/src/lib/chain/loan*.ts`, not from this table |
| `loan_payments` | R/W | none observed | |
| `evaluations` | R/W (EvaluatorController, OwnerDecisionController, seeders) | none observed | |
| `evaluator_reports` | R/W | none observed | |
| `evaluator_scores` | R/W | none observed | |
| `market_snapshots` | R/W (appraisal pipeline) | none observed | |
| `market_config` | R | none observed | |
| `brz_price_readings` | R/W (oracle job) | none observed | |
| `onchain_events` | **W** (Laravel webhook listener writes; OnchainEvent model) | **R** (`apps/web/src/app/api/auctions/route.ts`, `auctions/[id]/bids/route.ts`, `onchain-events/ticker/route.ts`, `onchain-events/custody-confirmed/route.ts`) | **Only shared table**. Drift in Section C makes this fragile. |
| `cron_runs` | W (cron job audit) | none observed | |
| `notifications` | R/W (Laravel Notifiable) | none observed | |
| `password_resets` | R/W (PasswordResetController) | none observed | |
| `failed_jobs` | R/W (queue) | none observed | |
| `personal_access_tokens` | R/W (Sanctum) | none observed | |
| Storage bucket `ccb-pdfs` | none observed | R/W (`apps/web/src/lib/chain/ccb-storage.ts`) | Next-only |

In short: **`onchain_events` is the only Laravel↔Next shared surface in this
repo today**. Everything else is single-app. The hand-off is one-directional
(Laravel writes events → Next reads to render auction/custody UI).

Caveats:
- Next's API routes degrade gracefully with `supabase_not_configured` when
  env is missing, so the integration is opt-in.
- The doc only inventories what's checked into the repo. If a Next-side
  module reads `loans` or `assets` from Supabase elsewhere, it was not
  found by `grep` on `from("…")` patterns inside `apps/web/src` and
  `packages/*/src` (zero matches outside `onchain_events` and the
  `ccb-pdfs` bucket).

---

## Section E — Questions and anomalies

1. **`onchain_events` schema drift (Section C).** Most load-bearing. The
   in-repo Supabase migration contradicts both the latest Laravel migration
   *and* the Next-side query shape. Must be reconciled before parallel-run.

2. **No RLS policies anywhere.** `supabase/migrations` has zero `alter table
   ... enable row level security` / `create policy` statements. Next-side
   API routes use the service-role key (`packages/supabase/src/server.ts:14`)
   and thus bypass RLS. The user-scoped helper `createUserServerClient`
   exists but is unused by any route under `apps/web/src/app/api/**`.
   Acceptable for a server-only ingest table; will need real policies before
   any client-side read.

3. **Two Solana-tx-hash columns on `loans`.** `disbursement_tx_hash` (88
   chars, mocked) and `confirm_custody_tx` (128 chars, real bridge). The
   migration comment on `2026_05_03_000001` explicitly keeps the legacy
   column rather than overload it. Once the atomic confirm-custody path
   ships, `disbursement_tx_hash` will be dead weight — flag for cleanup.

4. **`Loan::base58Encode` is dead code.** `site/app/Models/Loan.php:147-177`
   is a private fallback that `getSolanaLoanIdAttribute` never calls (the
   live path goes through `\App\Support\Base58`). Comment says it's kept
   "in case the autoload graph misbehaves". Candidate for removal once trust
   is established.

5. **Mocked devnet fields littered across schema.** Every `*_tx_hash`,
   `nft_mint_address`, `escrow_address`, `metadata_uri` column on
   `assets`/`loans`/`loan_payments` is populated with `Str::random(...)` in
   seeders. The real Solana state of record lives on-chain (Next reads it
   via `apps/web/src/lib/chain/*.ts` calling the program). These columns
   exist for Laravel-side UI display only — they will drift from on-chain
   reality forever. The port should decide whether to backfill them from
   `onchain_events` or to render straight from on-chain in Next and drop
   them on the Laravel side.

6. **`reference_number` is `nullable` on assets but `not null` on
   `market_snapshots`.** If an asset without a `reference_number` is
   evaluated (possible — `pending_evaluation` rows in seeders omit it),
   creating a `MarketSnapshot` will fail unless the controller fills it in.
   Worth confirming the appraisal pipeline always derives one.

7. **`market_config` table name is singular** while all other tables are
   plural. Documented inconsistency (model sets `$table = 'market_config'`).
   No action needed; just call out to whoever ports it.

8. **`condition` on assets is a free-form varchar(20)** while the seeders
   and model docstring imply an enum (`excellent`/`good`/`fair`). No CHECK
   constraint exists. Low risk but easy to harden.

9. **`MarketConfig` has no Postgres FK / referential link to anything.**
   Lookup is by `(brand, family)` strings against `assets.brand` /
   `assets.model` family — no join enforcement. By design (config table),
   but worth noting.

10. **`personal_access_tokens`, `failed_jobs`, `notifications`,
    `password_resets`** are pure Laravel-framework tables. The Next port
    won't touch them; on the Postgres side they will sit dormant if/when
    Laravel is decommissioned.

11. **`year` column on `assets` is Laravel's `year()` type.** On MySQL that's
    a 1-byte YEAR; on Postgres `Schema::year()` falls back to a 4-byte
    integer. Either way, range is fine — just a reminder that the type isn't
    portable.

12. **`condition`, `tier` and `trend`** on various tables are free strings
    with documented allowed values. Same caveat as point 8.

13. **`auth_provider`** on users is a free string defaulting to `email`. The
    factory and seeders only use `email` and `solana`. Worth a CHECK or a
    Postgres enum once the values stabilise.

---

```
STATUS: shipped
What landed:
  - /Users/gogy/MyCODE/VAULX/docs/plans/inventory/02-schema-and-data.md with:
    A) canonical schema for 18 tables (15 Laravel + onchain_events Supabase variant + ccb-pdfs bucket + framework tables)
    B) model ↔ table map for 12 Eloquent models
    C) Supabase vs Laravel drift focused on the load-bearing onchain_events table
    D) read/write surface by app — onchain_events is the only shared table
    E) 13 anomalies / open questions
What's blocked: none
What's next: reconcile onchain_events schema (PK type, signature unique, occurred_at vs created_at) before parallel-run cutover.
```
