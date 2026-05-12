# Vaulx — Demo UI

Demo Laravel application for **[Vaulx](https://vaulx.fi)** — a Brazilian RWA lending protocol on Solana that takes luxury watches as collateral, mints a legally-binding CCB (Cédula de Crédito Bancário), gates disbursement on an on-chain custody attestation, and settles loans in USDC.

This repository contains only the **borrower- and admin-facing web UI**. The Anchor programs, the bridge service, and the on-chain protocol design live in **[`Vaulxfi/vaulx-protocol`](https://github.com/Vaulxfi/vaulx-protocol)** — start there for the technical pitch.

Submitted to the **Colosseum Frontier hackathon**, May 2026.

---

## What this demo shows

A live walk-through of the borrower journey, against real on-chain transactions on Solana devnet:

1. Borrower registers an asset (Rolex Submariner, $15k appraised)
2. Admin / evaluators review and approve the appraisal
3. Borrower requests a USDC loan against the asset
4. **Admin signs `confirm_custody` on-chain → atomic disbursement to borrower's ATA**
5. Borrower views active loan and installment schedule

The custody confirmation step is the load-bearing piece of the product. The on-chain program literally cannot disburse without a signature from the designated custody key — no admin override, no backdoor.

Live deployment: **<https://vaulx.fi>**

---

## Stack

- **Laravel 8** (PHP 8.x, Blade templates, Bootstrap 5 via CDN)
- **MySQL** for off-chain state (users, assets, loans, payments)
- **Solana web3.js** (CDN) for wallet connect (Phantom / Backpack) and SIWS (Sign-In With Solana)
- **HMAC-signed HTTP** to the bridge service in `vaulx-protocol` for on-chain reads/writes

---

## Local setup

Requires PHP 8.1+, Composer, Node 18+, and MySQL.

```bash
git clone git@github.com:Vaulxfi/site.git vaulx-site
cd vaulx-site

composer install
npm ci && npm run build

cp .env.example .env
php artisan key:generate

# Edit .env: DB credentials, SOLANA_BRIDGE_BASE_URL, GF_USDC_MINT, etc.
# The bridge service lives in vaulx-protocol/apps/bridge — start it locally
# (HMAC shared secret must match on both ends).

php artisan migrate:fresh --seed
php artisan serve
```

Open `http://localhost:8000`.

---

## Demo accounts

The default seeder (`DatabaseSeeder`) creates these test users — password `password` for all:

| Email | Role | Stage |
|---|---|---|
| `admin@garantifi.com` | admin | Approves evaluations and custody |
| `carlos@demo.com` | borrower | 1 active loan + 1 repaid (Rolex + Porsche) |
| `ana@demo.com` | borrower | Loan in `pending_custody` + an evaluated asset |
| `roberto@demo.com` | borrower | Asset in `pending_evaluation` |

For the broader showroom personas (10 borrowers, one per journey stage), run:

```bash
php artisan db:seed --class=DemoBorrowersSeeder
```

Password: `demo123`. Emails under `@vaulx-demo.fi`.

---

## Tests

```bash
vendor/bin/phpunit                            # full suite
vendor/bin/phpunit --testsuite=Feature        # feature tests only
vendor/bin/phpunit --filter=LtvCeilingTest    # single test
```

---

## Pointers

- `app/Http/Controllers/BorrowerController.php` — asset registration, loan request, installment payment.
- `app/Http/Controllers/AdminController.php` — evaluation approval, custody confirmation (triggers the on-chain ix via the bridge).
- `app/Services/SolanaBridge.php` — HMAC-signed HTTP client to the bridge service.
- `routes/web.php` — the three role groups (public, borrower, admin) and their middleware.

---

## License

MIT — see [`LICENSE`](LICENSE).
