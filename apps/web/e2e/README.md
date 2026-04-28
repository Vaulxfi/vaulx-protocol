# Vaulx web — Playwright e2e

End-to-end smoke + regression tests against the deployed demo. Defaults to
`https://vaulx.vercel.app`; override with `PLAYWRIGHT_BASE_URL`.

## Run

```bash
# from repo root
pnpm --filter @vaulx/web exec playwright test --config=e2e/playwright.config.ts

# or against a local dev server
PLAYWRIGHT_BASE_URL=http://localhost:3000 \
  pnpm --filter @vaulx/web exec playwright test --config=e2e/playwright.config.ts
```

First run only:

```bash
pnpm --filter @vaulx/web exec playwright install chromium
```

## Files

- `playwright.config.ts` — chromium-only project, html + list reporter, trace on first retry
- `smoke.spec.ts` — every public route (lender + borrower flows + 3 sampled pages); asserts no console errors and no 5xx
- `kyc-gate.spec.ts` — exercises the `useKycGate("…")` lazy modal on `/demo/lend/vaults/retail-usdc`; smokes the route guards on disburse + register
- `api.spec.ts` — Sumsub `applicant-status` + `init-token` routes plus the on-chain ticker

## Gotchas

- `<input>` fields in the deposit/amount forms are React-controlled with custom onChange logic. `locator.fill()` does **not** trigger the handler — use `pressSequentially("250")` instead.
- `/demo/borrow/{custody,disburse,funds,dashboard}` redirect to `/demo/borrow/onboard` when there is no demo session. Tests accept either landing page.
- Crossmint sign-in opens a popup that needs a real OAuth flow. We do not cover it here — see `e2e/kyc-gate.spec.ts` for the rationale.

## Docs

Playwright Test docs: <https://playwright.dev/docs/intro>
