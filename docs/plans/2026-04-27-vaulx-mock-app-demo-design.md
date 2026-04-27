# Vaulx Mock App — Design Doc

**Date:** 2026-04-27
**Owner:** Vaulx (no personal names anywhere on the platform — see §9)
**Lives at:** `vaulx.vercel.app/demo/*`
**Submission deadline:** 2026-05-10
**Source-of-truth strategy thread:** [`VAULX_Architecture_Thread.md`](../../VAULX_Architecture_Thread.md), [`vaulx-direction.html`](../../vaulx-direction.html), [`VAULX_Architecture_Slide.md`](../../VAULX_Architecture_Slide.md)

---

## Goal

Ship a clickable, judge-grade mock of Vaulx's full maximalist vision — onboarding → wallet → asset registration → appraisal → CCB e-signature → custody → disbursement → in-app spend (Pix / wallet / debit card) → real-time collateral dashboard → repay/renew → 3-tier auction waterfall — under `vaulx.vercel.app/demo/*`. The mock embeds in the existing Vaulx Next.js app, reuses the editorial dark-operator design system, and is reachable from the live production deploy on every git push.

## Archetype + scope

**Archetype:** Editorial dark-operator hybrid that already powers the production app. Borrower screens render in an iPhone bezel on desktop / full-bleed on mobile. Lender + admin + architecture screens render desktop-responsive. (See §1.)

**Scope (β+):** Full borrower flow + full lender flow + 3-tier auction waterfall + landing + interactive architecture diagram. ~22 routes total, ~18 substantive screens. Default flow visualized via the auction surface; lender side mocks Kamino + Plume + Tokeny + FIDC routing.

**Real vs mock split** (see §2 for full matrix): real for self-serve dev integrations (Privy, Crossmint, LazorKit, Civic CAPTCHA, WatchCharts, Chrono24 fallback). Mock for everything that requires commercial agreements (Privy Pix off-ramp, Solflare/lobster card, Kamino OCC, Plume Nest, Tokeny ERC-3643, gov.br official, Brinks IoT). All mocks ship with `MOCK · partnership in progress` ribbons; partnership tracking lives in `PARTNERSHIPS.md`.

---

## §1 — Architecture & route map

```
/demo                            ── A · Desktop hero. Two CTAs: "Borrow" / "Lend". Auto-plays
                                      a 4-second loop from the architecture diagram as marketing.
/demo/architecture               ── A · Two-swimlane diagram from VAULX_Architecture_Slide.svg
                                      with hover tooltips per partner. Adapted from
                                      VAULX_Architecture_Interactive.html, themed to /demo palette.
─────────────── BORROWER (mobile bezel on desktop, full-bleed on mobile) ───────────────
/demo/borrow/onboard             ── Civic CAPTCHA real + gov.br mocked. 60-sec stopwatch UI.
/demo/borrow/wallet              ── Privy / Crossmint / LazorKit chooser (real SDKs)
/demo/borrow/register            ── Watch make/model/ref/year/condition + 3-photo upload
/demo/borrow/appraisal           ── Chrono24 + WatchCharts + internal model triangulation
                                      (existing /api/appraisal route)
/demo/borrow/loan-offer          ── LTV slider, term, rate; <CcbDocument> + signature pad
/demo/borrow/custody             ── Calendar mock to book Brinks/Prosegur/Loomis SP slot
/demo/borrow/awaiting-custody    ── IoT feed mock + custody confirmation status
/demo/borrow/disburse            ── THE AHA MOMENT. Tap → CustodyNotConfirmed (red).
                                      Custodian signs (visible). Tap → green → USDC streams.
/demo/borrow/funds               ── Vaulx in-app USDC balance + 3 outflow CTAs
/demo/borrow/funds/pix           ── Pix off-ramp mock (Privy fiat partner)
/demo/borrow/funds/wallet        ── Send to external Solana wallet (real on-chain devnet)
/demo/borrow/funds/card          ── Solflare Card / lobster.cash spend mock
/demo/borrow/dashboard           ── Live LTV gauge, RedStone-wrapped Chrono24 sparkline,
                                      IoT feed loop, <LiveTicker>, repay/renew CTAs
/demo/borrow/repay               ── Full payoff flow
/demo/borrow/renew               ── Term extension + 2% flat fee
─────────────── LENDER (desktop responsive) ───────────────
/demo/lend                       ── Operator dashboard: 4 vault tranches
/demo/lend/onboard               ── KYC for accredited (Civic + Tokeny ERC-3643 mock)
/demo/lend/vaults/[id]           ── Vault detail: TVL, APY, current LTV health, deposit form
/demo/lend/liquidity             ── Kamino OCC + Plume Nest + SCD + FIDC routing visualization
                                      (adapted from vaulx-liquidity-architecture.html)
─────────────── DEFAULT WATERFALL (desktop responsive) ───────────────
/demo/auction                    ── "Foreclosure floor" — list of currently-defaulted TRDCs
/demo/auction/[trdc]             ── 3-tier waterfall. Tier 1 (Platform lenders, 72h) → Tier 2
                                      (Reseller curated, 48h) → Tier 3 (Public, 168h). Live
                                      bid feed, bid form, asset reveal with IoT badge.
```

**Total: 22 routes**, 18 substantive screens, 4 connector/overview pages. Form factors:

| Surface | Form factor | Why |
|---|---|---|
| `/demo`, `/demo/architecture`, `/demo/lend/*`, `/demo/auction*` | A — desktop responsive | Marketing + operator surfaces; desktop-natural |
| `/demo/borrow/*` | C — iPhone bezel on desktop, full-bleed on mobile | Borrower app is intrinsically a phone product |

---

## §2 — Real vs Mock integration matrix + Partnership tracker

### Per-integration implementation

| # | Partner | Implementation in `/demo/*` | Real prod path |
|---|---|---|---|
| 1 | **Civic Pass (CAPTCHA)** | **REAL** — reuse existing `<CivicPassGate>` from main app | Live |
| 2 | **gov.br** | **MOCK** — reuse existing `/borrow/verify-id/*` themed for `/demo` | Brazilian-registered entity, gov registration |
| 3 | **Privy (auth + wallet)** | **REAL** — sandbox app id + secret | Self-serve, no contract |
| 4 | **Crossmint** | **REAL** — sandbox dev API key | Self-serve, paid tier for prod |
| 5 | **LazorKit** | **REAL** — open-source SDK, no key needed | Self-serve |
| 6 | **WatchCharts API** | **REAL** — `lib/appraisal/watchcharts.ts` already wired | Free tier; paid tier for full feed |
| 7 | **Chrono24 scrape** | **REAL fallback-safe** — `lib/appraisal/chrono24.ts` already wired | Data licensing required for prod |
| 8 | **RedStone / Pyth** | **MOCK on `/demo/borrow/dashboard`** — `RedStone-fed` badge with simulated 60s tick | Self-serve oracle integration |
| 9 | **Brinks / Prosegur / Loomis** | **MOCK** — calendar mock + looped IoT clip + `📡 LIVE` badge | Custody contracts (P0) |
| 10 | **Privy Pix off-ramp** | **MOCK** — `Sending R$X to ••••5234 · Banco Inter` flow | Privy + fiat partner KYB (P1, ~1-4 weeks) |
| 11 | **Solflare Card / lobster.cash** | **MOCK** — Apple-Pay-styled "Add to Wallet" + tx feed | Card-issuer partnership (P2) |
| 12 | **Kamino OCC** | **MOCK** — tranche selector on `/demo/lend/liquidity` | Kamino partnership (P2) |
| 13 | **Plume Nest** | **MOCK** — adjacent to Kamino on same screen | Plume partnership (P2) |
| 14 | **Tokeny / ERC-3643** | **MOCK** — KYB flow on `/demo/lend/onboard` | Tokeny partnership (P2) |
| 15 | **CCB.B3 + e-signature** | **REAL PDF + MOCK SIGNATURE** — `@vaulx/ccb` PDF + canvas signature pad, signature hash stored in PDF metadata | DocuSign / D4Sign integration (P2) |
| 16 | **Auction PDA (3-tier waterfall)** | **MOCK with optional real Devnet bidding** — synthetic bid replay; if Devnet programs are deployed, the bid form fires real `auction.place_bid` | Real on-chain (Phase 4 deploy) |
| 17 | **TRDC = cNFT (Bubblegum)** | **MOCK** — TRDC viewer on dashboard | Real Bubblegum CPI (Phase 4+) |

**Counts:** 6 real + 11 mock. The 6 real integrations are SDK-only; no commercial agreement required to ship.

### `PARTNERSHIPS.md` — internal team tracker (committed alongside this doc)

Top-of-file priority queue for the team. **Internal — never rendered in user-facing UI.** Owners are tracked here only because this is a team artifact.

```
P0 — must close before launch (May 10)
- BACEN-licensed SCD (LOI required)
- One licensed custodian: Brinks SP / Prosegur / Loomis (MOU + CFTV/IoT rights)
- Brazilian fintech counsel for CCB + fiduciary alienation

P1 — close by submission for "named partner" deck mention
- Civic full-KYC gatekeeper sub (paid)
- Privy Pix off-ramp partner (KYB conversation)
- Crossmint production tier confirmed
- LazorKit joint mention / quote

P2 — close post-submission for first integrations
- Kamino Off-Chain Collateral institutional onboarding
- Plume Nest institutional issuance
- Tokeny ERC-3643 FIDC wrapper for accredited LP onboarding
- Chrono24 data licensing
- WatchCharts paid tier
- Card issuer (Marqeta / Lithic / dock.io) OR deep-link to Solflare/lobster

P3 — eventually
- gov.br official OAuth (requires Brazilian registered entity)
- Bubblegum / Helius for cNFT loan representations
```

Format per item: `- [status emoji] [name] — [owner] — [notes]`. Each mocked screen in `/demo/*` displays a `MOCK · partnership in progress` ribbon that maps 1:1 to a `PARTNERSHIPS.md` entry.

---

## §3 — Component inventory

### Shared primitives (~14 components, ~1.5 days)

**Layout chrome:**
- `<DemoShell>` — wraps every `/demo/*` route. Reads route metadata's `formFactor: 'phone' | 'desktop'`. Renders `<PhoneBezel>` on desktop for phone routes. On mobile: always full-bleed.
- `<PhoneBezel>` — iPhone 15 Pro silhouette, dynamic island, status bar (mocked time/battery/signal/`carrier="VAULX"`), home indicator. Inner viewport 393×852.
- `<DemoTopBar>` — slim header replacing `<SiteHeader>`. Pills: Reset demo · Tour · Exit demo.
- `<DemoFooterNav>` — phone-only bottom-tab nav inside `<PhoneBezel>` (Home / Borrow / Spend / Dashboard / Settings).

**Wallet chooser:**
- `<PrivyLoginCard>` — real Privy embedded SDK in sandbox.
- `<CrossmintLoginCard>` — real Crossmint embedded checkout/wallet SDK.
- `<LazorKitFaceIDCard>` — real LazorKit SDK; iPhone passkey/FaceID.

**Trust + integration badges:**
- `<MockBadge>` — bottom-right brass ribbon: `MOCK · {partner-name} · agreement pending`. Dismissible per session.
- `<LiveBadge>` — small green pill: `LIVE · {partner-name}`.

**Data primitives:**
- `<LtvGauge>` — circular brass progress; mono numeral at center; safe/warn/danger zones.
- `<LiveTicker>` — borrower-facing event stream (5-second tick).
- `<RedstoneFeedCard>` — 24h sparkline of collateral value + RedStone+Pyth+Chrono24 source pills.

**Domain components:**
- `<CcbDocument>` — `@vaulx/ccb` PDF + canvas signature pad. Signature image hashed into PDF Keywords on submit.
- `<AuctionTierTimeline>` — three-stage horizontal: Tier 1 → Tier 2 → Tier 3. Active tier brass left-rule + countdown.

### Per-screen specs — sample

| Route | Form | Key behavior |
|---|---|---|
| `/demo/borrow/onboard` | Phone | 60-sec onboarding stopwatch; Civic Pass + CPF stored to session |
| `/demo/borrow/wallet` | Phone | User picks one of 3 SDKs; real call fires; resulting Solana pubkey stored |
| `/demo/borrow/appraisal` | Phone | Animated reveal of Chrono24 → WatchCharts → Vaulx Model → median in 800ms |
| `/demo/borrow/loan-offer` | Phone | LTV slider + term + rate + signature pad → submit → state advances |
| `/demo/borrow/disburse` | Phone | First tap → CustodyNotConfirmed (red); custodian signs (right-side phone); second tap → green → USDC streams |
| `/demo/borrow/funds/pix` | Phone | "Sending R$X to ••••5234" → 2s spinner → "✓ Received at Banco Inter" |
| `/demo/borrow/dashboard` | Phone | LTV gauge + RedStone sparkline + IoT video + ticker; updates every 5s |
| `/demo/lend/liquidity` | Desktop | Architecture diagram inline; Kamino + Plume + SCD + FIDC tranche tiles with hover tooltips |
| `/demo/auction/[trdc]` | Desktop | `<AuctionTierTimeline>` + live bid feed + bid form |

Full per-screen table to be expanded in the implementation plan.

---

## §4 — Data flow & state model

Five layers, explicit boundaries.

### Layer 1: `vaulx_demo_session` in sessionStorage

```ts
type DemoSession = {
  sessionId: string;          // uuid
  startedAt: number;
  civic: { gatewayToken?: string; verifiedAt?: number };
  govbr: { cpf?: string; name?: string; verifiedAt?: number };
  wallet: {
    provider?: 'privy' | 'crossmint' | 'lazorkit';
    pubkey?: string;            // real Solana pubkey from chosen SDK
    email?: string;
  };
  watch?: {
    make: string; model: string; ref: string; year: number;
    condition: 'mint' | 'excellent' | 'very_good' | 'good';
    photos: string[];           // data-URLs (small thumbnails)
    appraisal?: { chrono24: number; watchcharts: number; internal: number; median: number };
    priceHistory: number[];     // 24-point random walk for the dashboard sparkline
  };
  loan?: {
    loanId: string;
    principalAtoms: bigint;
    rateBps: number; termDays: number; dueTs: number;
    ccbHashHex: string;
    signatureDataUrl: string;
    custody: { provider: 'brinks' | 'prosegur' | 'loomis'; bookedSlot?: string; confirmedAt?: number };
    disbursedAt?: number;
    inAppBalanceAtoms: bigint;  // running balance after PIX/wallet/card outflows
  };
  tour: { active: boolean; step: number; resumable: boolean; history: number[] };
  mocksDismissed: string[];
};
```

`useDemoSession()` hook hydrates this object on mount across every screen. Navigating between routes never re-fetches identity/wallet/loan state.

### Layer 2: Real SDK calls

| When | Fires | Persists to |
|---|---|---|
| `/demo/borrow/onboard` | Civic CAPTCHA gateway-token issuance | `civic.gatewayToken` |
| `/demo/borrow/wallet` (Privy) | `privy.login()` | `wallet.{provider, pubkey, email}` |
| `/demo/borrow/wallet` (Crossmint) | Crossmint embedded SDK | same shape |
| `/demo/borrow/wallet` (LazorKit) | LazorKit `connect()` (FaceID prompt) | same shape |
| `/demo/borrow/appraisal` | Existing `/api/appraisal` | `watch.appraisal` |
| `/demo/borrow/funds/wallet` | Real on-chain Devnet SOL/USDC transfer (signed by connected wallet) | tx signature in toast |

SDK errors fall back to a `<DegradedMockNotice>` banner; session remembers which integrations degraded.

### Layer 3: Mock data fixtures

Server-side, deterministic, imported with JSON attributes. Lives at `apps/web/src/app/demo/_fixtures/`:

- `pix-recipients.json` — 3 fake bank destinations (`••••5234 · Banco Inter`, `••••8821 · Nubank`, `••••3392 · Itaú`). No personal names.
- `card-tx-feed.json` — 12 sample debit-card transactions, merchant-keyed (`Uber · -R$ 28.40`, `Pão de Açúcar · -R$ 142.18`). No personal names.
- `kamino-tranches.json` — 4 institutional tranches with realistic APY/TVL/duration.
- `plume-issuances.json` — 3 mocked Plume Nest issuances.
- `auction-bids.json` — 8 synthetic bids with timestamps. Bidders pseudonymized as `vaulx-lender-04`, `vaulx-lender-12`, etc. No personal names.
- `iot-feed.mp4` — short looped vault-interior clip (royalty-free or generated).

### Layer 4: Live ticker stream (synthetic + session-anchored)

`<LiveTicker>` emits events on a 5-second tick. Synthetic but anchored: if you've signed a 60k USDC loan at 1000bps, the ticker emits an `interest_accrued` event every 5s with the correct numerical change. Real-world replacement: swap the synthetic generator for a Supabase WebSocket once on-chain volume exists. Same component.

### Layer 5: RedStone-wrapped Chrono24 simulation

24-hour sparkline of watch market value. Generated at session start: appraisal median + deterministic random walk (±2%/h, ±8% over 24h), stored as `watch.priceHistory`. LTV gauge reacts in real time during the demo. Realistic enough for visual; not a market signal.

### Reset

`<DemoTopBar>` "Reset demo" pill clears `vaulx_demo_session` from sessionStorage and redirects to `/demo`. Real wallets created via Privy/Crossmint/LazorKit persist in their SDK's own storage; user can re-link the same wallet on a fresh run.

---

## §5 — Guided tour mechanism

**Library:** `driver.js` (~10KB, zero deps, route-change aware).

**Tour state** lives in `vaulx_demo_session.tour`. `<DemoTopBar>` "Tour" pill toggles `active`. If `step > 0` and `resumable === true`, label reads "Resume tour (step 7/14)".

**The 14-step canonical Rolex story:**

| # | Route | Tour caption headline (Fraunces) |
|---|---|---|
| 1 | `/demo` | This is Vaulx — let's borrow against a Rolex in two minutes. |
| 2 | `/demo/borrow/onboard` | 60-second KYC. Civic Pass real on Solana. gov.br for Brazilian PII. |
| 3 | `/demo/borrow/wallet` | Three wallet options. Crossmint for non-crypto. LazorKit for FaceID. Privy (Stripe-acquired) for email. |
| 4 | `/demo/borrow/wallet` (post-login) | Wallet provisioned in <2 sec. No seed phrase, no extension. |
| 5 | `/demo/borrow/register` | Register your watch. Make + model + reference + 3 photos. |
| 6 | `/demo/borrow/appraisal` | Triangular appraisal. Chrono24 scrape. WatchCharts API. Vaulx model. |
| 7 | `/demo/borrow/loan-offer` | Pick LTV, term, rate. Sign the CCB.B3 — Brazil's most weaponized credit instrument. |
| 8 | `/demo/borrow/custody` | Book a licensed vault. Watch goes in custody — 48h expert eval. |
| 9 | `/demo/borrow/awaiting-custody` | Live IoT feed from the vault. Custodian signs the on-chain confirmation. |
| 10 | `/demo/borrow/disburse` | **AHA MOMENT.** Tap "Release funds" before custody → contract refuses with `CustodyNotConfirmed`. Custodian signs. Tap again → USDC streams. |
| 11 | `/demo/borrow/funds` | Funds in your Vaulx wallet. Three ways out. |
| 12 | `/demo/borrow/funds/pix` | Pix in 2 seconds. R$ at your bank. |
| 13 | `/demo/borrow/dashboard` | Live LTV. RedStone-wrapped Chrono24. Vault telemetry. |
| 14 | `/demo/borrow/repay` | Repay anytime. Renew if you need more time. Default → 3-tier auction. |

**Resume + skip semantics:**
- "Skip tour" → `tour.active = false`, `step` preserved.
- Tab close → sessionStorage clears → tour resets to step 0.
- "Restart from beginning" link in every overlay.
- Step 10 (AHA moment) explicitly pauses; user-driven, not auto-advance.

**Off-tour navigation:** every route reachable from `<DemoFooterNav>` or direct URL. State persists from sessionStorage. "Tour" pill picks up at `tour.step` whenever re-clicked.

**Tour overlay theming:**
- Brass ring `box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.45)` on highlighted element
- Popover: `bg-[var(--bg-elev-2)]`, hairline border, Fraunces headline, mono caption, brass Next / ghost Skip
- "Step N / 14" eyebrow in mono uppercase

---

## §6 — Auction waterfall surface (the moat)

### Routes
- `/demo/auction` — the floor; list of currently-defaulted TRDCs (always ≥3 mock auctions running)
- `/demo/auction/[trdc]` — detail page with the 3-tier waterfall, live bid feed, bid form

Both desktop responsive (form factor A) — operator-grade, dense data, hairlines.

### `<AuctionTierTimeline>` — hero component

Three tiers side-by-side, connected by horizontal flow line. Active tier glows with brass left-rule (`border-l-4 border-[var(--brand)]`) and live countdown. Pending tiers dimmed but readable; show their trigger rules. Smooth animated transition between tiers when timer elapses or reserve isn't met.

```
TIER 1 · 72H              | TIER 2 · 48H              | TIER 3 · 168H
Platform lenders           | Reseller curated network  | Public auction
Privileged window          | Vaulx-curated dealers     | Solana + off-chain
●●●●●● 41/72h elapsed      |     ⌛ pending            |     ⌛ pending
HIGH BID  R$ 38,200        | —                         | —
BIDDERS   12               |                           |
RESERVE   R$ 36,000  ✓     |                           |
       ACTIVE              |        NEXT               |       FALLBACK
```

### Three editorial blocks below the timeline (the moat told in plain language)

```
TIER 1 — Platform lenders                   72-hour privileged window
  Vaulx lenders who funded the loan get first refusal at par or
  better. They already underwrote the borrower; they get the
  recovery upside.

TIER 2 — Reseller network                   48-hour curated bidding
  Vaulx-curated luxury-watch dealer network. They can resell
  at retail margin, so they outbid retail wholesale. Network
  effect: every dealer Vaulx onboards widens this tier's demand.

TIER 3 — Public auction                     168-hour open auction
  Open to anyone with USDC and a wallet. Hybrid: Solana-native
  bids on-chain, off-chain bids reconciled by oracle. Ensures
  liquidity even in cold markets.
```

### Live bid feed (right-side scrolling list)

Replays 8 mock bids from `auction-bids.json` over a 60-second loop. Each line: timestamp (mono), `bid · X USDC`, pseudonymized bidder pubkey (last 4 of base58, e.g., `vaulx-lender-04`), tier tag. "RESERVE PRICE: R$ 36,000 (cleared)" line highlighted brass.

### Bid form

Visible only when wallet connected. Validates `amount >= reserve` AND `amount >= high_bid + min_increment`. Submit fires real on-chain `auction.place_bid` once Devnet programs are deployed; otherwise appends to synthetic feed.

### Asset reveal

Above the timeline: watch photo, model, year, condition, last-known location ("Brinks SP · Vault A-32"), `📡 LIVE` badge over 4-second IoT clip. Sells the narrative: real watch, real custody, real recovery flow.

### What this surface accomplishes

1. Defensive moat made visible — judges see the rule system that competitors would have to copy
2. Network effect made tactile — Tier 2 description hooks to the dealer-network outreach track
3. Two-sided story closure — borrower + lender loops both end at the auction
4. A demo screen that lasts — static screenshots can't convey the tier transition; this one does

---

## §7 — Build sequence + risk plan

### Day-by-day plan (9 working days, 3 buffer)

| Day | Date | Deliverable |
|---|---|---|
| 1 | Apr 28 | Foundation: route tree, `<DemoShell>` / `<PhoneBezel>` / `<DemoTopBar>` / `<DemoFooterNav>`, `useDemoSession()` hook. Blank `/demo` deployed. |
| 2 | Apr 29 | `/demo/borrow/onboard` (Civic + gov.br); `/demo/borrow/wallet` (3 real SDKs wired). |
| 3 | Apr 30 | `/demo/borrow/register` (form + photos); `/demo/borrow/appraisal` (existing /api/appraisal). |
| 4 | May 1 | `/demo/borrow/loan-offer` (`<CcbDocument>` + signature); `/demo/borrow/custody` (calendar mock); `/demo/borrow/awaiting-custody` (IoT loop). `<MockBadge>`/`<LiveBadge>`. |
| 5 | May 2 | THE AHA MOMENT — `/demo/borrow/disburse` choreography. Step 10 tour pause/resume. |
| 6 | May 3 | `/demo/borrow/funds` + `/funds/pix` + `/funds/wallet` (real Devnet send) + `/funds/card`. |
| 7 | May 4 | `/demo/borrow/dashboard` (LTV + RedStone + ticker + IoT); `/demo/borrow/repay` + `/renew`. |
| 8 | May 5 | Lender side: `/demo/lend`, `/lend/onboard`, `/lend/vaults/[id]`, `/lend/liquidity`. |
| 9 | May 6 | Auction floor + detail (`<AuctionTierTimeline>`, bid feed, bid form). `/demo/architecture`. `/demo` landing. driver.js across all 14 steps. |
| 10–12 | May 7–9 | Buffer: bug fixes from team walkthrough; empty/loading/error pass; demo video record; README screenshots. |

### Parallel team tracks (don't block dev)

- SCD LOI + custodian MOU + fintech counsel
- Civic / Privy / Crossmint / LazorKit / Kamino / Plume warm intros (each confirmed convo upgrades a `MOCK · agreement pending` ribbon to `MOCK · partner aligned` or graduates to `LIVE`)
- `PARTNERSHIPS.md` updated daily

### Risks

| Risk | Mitigation |
|---|---|
| Privy/Crossmint/LazorKit sandbox flake on demo day | `<DegradedMockNotice>` + auto fallback; session persistence so retries don't re-trigger SDK |
| Devnet program deploy still blocked by SOL budget | Bid form gracefully degrades to synthetic; `MOCK · awaiting Devnet deploy` ribbon |
| Tab refresh kills demo state mid-pitch | sessionStorage covers refresh; tab-close = reset is desired |
| LazorKit FaceID needs HTTPS + recent iOS Safari | Vercel HTTPS in place; tour caption mentions "Best on iPhone Safari iOS 16+" |
| Real wallet send needs SOL on user wallet | Fountain wallet drips 1-USDC airdrop on first use; falls back to mock if dry |
| Mock data feels fake to a sharp judge | Mock badges are honest, not hidden; moat surfaces lean on real numbers |

---

## §8 — Success criteria

### Hard checks (CI / Vercel build)
- `pnpm --filter @vaulx/web build` green; `pnpm -w typecheck` green; `pnpm --filter @vaulx/web test` green
- All `/demo/*` routes return HTTP 200 in production
- `<MockBadge>` on every mock-tagged screen; `<LiveBadge>` on every real-integration screen — verified by smoke test
- Lighthouse: ≥85 mobile, ≥90 desktop on `/demo`
- **No personal names anywhere in `/demo` rendered HTML** — verified by CI grep (see §9)

### Walkthrough acceptance (manual, by team)
1. Cold land on `/demo`; hero loads <2s; Borrower / Lender CTAs legible
2. Guided tour 1→14 without intervention; no breaks, no 404s, no console errors
3. Step 10 AHA moment lands: refuse-then-accept choreography convincing
4. Skip tour at step 7; free-roam to dashboard; state persists; LTV animates
5. Resume tour: picks up at step 7 exactly
6. Cross to `/demo/lend`: switches to desktop responsive, no jolt
7. Cross to `/demo/auction/[any]`: tier transition animates within 60s
8. Reset demo button: clears session, real wallet still re-linkable
9. All MOCK badges describable in one sentence per partner
10. Real iPhone Safari: `/demo/borrow/wallet` → tap LazorKit → real FaceID prompt fires

### Judge-readiness (May 9)
- 2-min demo video records cleanly off live URL
- Deck screenshots from live URL; tour overlays + IoT clip captured in motion
- `PARTNERSHIPS.md` reflects current partnership states
- README "Live demo" link → `/demo` (not just `/`)
- Cold incognito load `/demo/borrow/dashboard`; quote any number; nothing reads fake or wrong

### Explicitly NOT a success criterion
- Real Devnet program deploy (auction bids fall back to synthetic)
- Real Privy Pix (mock tells the same story)
- Real gov.br integration (mock acceptable indefinitely until BR entity exists)

---

## §9 — Global rule: NO PERSONAL NAMES

The platform speaks as **Vaulx** (the institution). Across all UI, copy, deck, tour captions, mock data, fixtures, bidder labels, and recipient names — no founder or team-member names appear.

### Allowed
- Roles: borrower, lender, custodian, dealer
- Networks: "Vaulx-curated dealer network", "Vaulx Reseller Network"
- Brand names: Banco Inter, Brinks, Civic, Crossmint, etc.
- Pseudonymized identifiers: `vaulx-lender-04`, `••••5234`

### Not allowed (anywhere user-facing or judge-facing)
- Any first or last name from the founding team
- "Felipe's network", "Marcelo's contacts", "Edson's stack" — even in tooltips

### Exceptions (internal-only)
- `PARTNERSHIPS.md` — internal team tracker, never rendered in UI; the file header reads "Internal team tracker. Not user-facing."
- `docs/plans/*.md` (this doc included) — design / strategy files; not consumed by app UI
- `VAULX_Architecture_Thread.md` and similar conversation logs — not user-facing

### Enforcement

CI grep, runs on every PR / push to main:

```bash
! grep -rE "(Felipe|Marcelo|Rodrigo|Edson|George|gogy)" \
    apps/web/src/app/demo/ \
    apps/web/src/components/vaulx/demo*/
```

Returns 0 hits → pass. ≥1 hit → block deploy with the offending file:line in the failure message.

---

## §10 — Hand-off

Next: invoke `superpowers:writing-plans` to translate this design into a step-by-step implementation plan at `docs/plans/2026-04-28-vaulx-mock-app-implementation-plan.md`.

The implementation plan will:
- Decompose §7's day-by-day into per-task specs (each ~2-5 min granularity)
- Specify TDD structure where applicable
- Reference component file paths, exact snippet shapes, exact commands to run
- Include git commit message templates per task

After the plan lands and is approved, dispatch the build via `superpowers:subagent-driven-development` against the 9-day calendar.
