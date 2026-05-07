# Vaulx — Technical Demo Video: Recording Spec (v2)

**Target length:** 2:45 (hard cap 3:00)
**Format:** Live screen recording with voice-over + brief Solana Explorer cuts
**Submission:** Colosseum Cypherpunk Hackathon 2026, deadline **May 10, 2026** (~6 days from today)
**Audience:** technical judges + Solana ecosystem reviewers

> **v1 → v2 changelog** (after `TRIAGE.md` against actual built state):
> - Submission deadline corrected: May 10 (not 11).
> - Reframed from "build spec" to **"recording spec"** — Phase 3 is complete; the build is largely done. This doc now governs what to film, not what to ship.
> - **Lead with Solana Explorer + atomic confirm-and-disburse invariant** in the first 30 seconds (was previously a side beat in shots 4–5).
> - **Demo backbone = `/admin/demo` cockpit** — already built, accelerates time, hits all 6 moments cleanly. Replaces fresh-wallet re-staging.
> - **4 Anchor programs** named explicitly: vault · loan · trdc · auction (was "an Anchor program" singular).
> - **KYC corrected**: Civic Pass (on-chain CAPTCHA gate) + Sumsub (full KYC w/ native SAS, May 2025) — dual-stack, both real.
> - **Oracle**: Pyth + RedStone shown as multi-oracle support; production source TBD.
> - **LP cutaway**: `/lend/auctions` ("The Foreclosure Floor") + `/lend/vaults` — actual built pages, not the fictional "Loopscale dashboard."
> - **Solana Pay QR codes** (built) added as a phone-side UX moment.
> - **`/admin/tests` SSE runner** added — show live `anchor test --skip-build` output for the test-count beat.
> - **Built-state pre-checks** added (Phase 3 complete inventory).

---

## Pre-flight (run on recording day)

| Check | Command / location | What "ok" looks like |
|---|---|---|
| Anchor tests current count | `pnpm anchor:test` (or root `anchor test --skip-build`) | exact pass count → captured for the on-screen banner |
| Frontend live | `vaulx.vercel.app` | renders, wallet connects |
| Devnet program IDs | `Anchor.toml` + Solana Explorer | 4 program IDs all show recent activity |
| Repo public | `github.com/Vaulxfi/...` | not 404 for unauthenticated user — **flip from private to public day-of** |
| Demo cockpit live | `vaulx.vercel.app/admin/demo` | 6 buttons + accelerate-time toggle render; admin-cookie set |
| Static test-run replay fallback | `apps/web/public/demo/test-run.log` | exists, ANSI-coloured, 45+ pass lines |

---

## Top-level decisions (locked)

- **Single persona**: Marcelo, the borrower. **One LP cutaway** at ~1:35 (~15s) showing `/lend/auctions` ("The Foreclosure Floor"). Two-sided story without confusion.
- **Three Solana primitives headlined**: cNFT (Bubblegum state compression), SAS (Solana Attestations Service via Sumsub native integration, May 2025), composability with Kamino + Loopscale curated lending rails.
- **Three Solana primitives backgrounded**: atomic-tx state-machine gating across 4 programs (vault/loan/trdc/auction), Crossmint social wallet, Pyth + RedStone multi-oracle.
- **The headline architectural invariant**: **atomic confirm-and-disburse** — `vault.disburse` requires (1) `loan_authority` PDA signer + (2) sysvar check that top-level tx is from `loan` program. This is the differentiator. **Lead the demo with it.**
- **Auction**: shown live via `/admin/demo` Moment 06 (default + auction in ~10s with `fast=true` toggle), not just architecture mention.
- **Devnet, not mainnet**. All on-chain transactions are real Devnet transactions, signed by real keys, visible on Solana Explorer (devnet).
- **No mocks where avoidable**. Where a step is mocked (e.g., `gov.br` ID, Sumsub sandbox), the UI's existing `[demo]` badge stays visible.

---

## What's already built (Phase 3 baseline — read before filming)

This is the inventory. Don't re-build; film against this.

### On-chain (Anchor 0.30.1, Devnet)

| Program | Key instructions | Notable PDAs / events |
|---|---|---|
| **vault** | `initialize_vault_config`, `initialize_vault`, `deposit`, `withdraw`, `disburse` (CPI-only, 2-layer gate), `record_inflow`, `record_auction_inflow`, `issue_kyc_attestation`, `set_kyc_required`, `close_kyc_attestation` | `VaultConfig`, `Vault`, `KycAttestation` PDA, events: `Deposited`, `Withdrawn`, `Disbursed`, `KycRequiredChanged` |
| **loan** | `initialize_loan_config`, `create_ccb_trdc` (LTV-gated CPI into trdc), `confirm_custody` (atomic — emits CustodyConfirmed + DisburseRequested in one tx), `pay_installment`, `repay_ccb`, `renew_ccb`, `execute_af_default` (permissionless after 3-day grace) | `LoanConfig`, events: `CcbTrdcCreated`, `CustodyConfirmed`, `DisburseRequested`, `InstallmentPaid`, `CcbRepaid`, `CcbRenewed`, `AfDefaultExecuted` |
| **trdc** | `initialize_trdc_state`, `init_trdc_config`, `init_merkle_tree`, `mint_trdc_cnft` (Bubblegum CPI), `confirm_custody_transition`, `transition_to_active`, `apply_installment`, `transition_active_to_repaid`, `transition_renew` | `TrdcState` (7-state enum: PendingCustody → ActiveInCustody → Active → Repaid / Renewed / Overdue → Defaulted → Liquidated), events: `TrdcStateInitialized`, `TrdcTransitioned`, `TrdcMinted` |
| **auction** | `create_auction`, `place_bid`, `close_auction` | `Auction` PDA at `[b"auction", trdc_state]`, events: `AuctionCreated`, `BidPlaced`, `AuctionClosed`, `AuctionClosedNoBids` |

### Off-chain

- **`apps/web`** — Next.js 14 + Tailwind + shadcn. Pages live: `/`, `/lend`, `/lend/vaults`, `/lend/vaults/[id]`, `/lend/auctions`, `/lend/auctions/[id]`, `/borrow/loans/[trdc]/{pay,renew,repay}`, `/admin/demo`, `/admin/tests`, `/borrow/verify-id/*` (gov.br mock).
- **`apps/bridge`** — webhook listener (HMAC-SHA256 auth), typed reads for loan-config/vault/trdc-state, Anchor provider.
- **`apps/indexer`** — subscribes to vault + loan + auction programs via Anchor `EventParser`; persists to Supabase `onchain_events` table; Kamino router module.
- **`packages/`** — `@vaulx/types`, `@vaulx/terms` (rate/interest/renewal math, vitest-tested vs JS goldens), `@vaulx/ccb` (deterministic A4 CCB PDF generator + SHA-256), `@vaulx/anchor-client` (hand-rolled façade).

### Integrations

| Integration | State | Note |
|---|---|---|
| Crossmint social login → Solana wallet | live | Devnet |
| **Civic Pass on-chain CAPTCHA gate** | **live** | Gateway program `gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs`, cloned from mainnet at test start |
| **Sumsub WebSDK + native SAS integration** | live (sandbox) | KYC GREEN webhook → server-side `issue_kyc_attestation` mint helper (idempotent) |
| Chrono24 + WatchCharts appraisal aggregator | live | `POST /api/appraisal`, 3-source parallel + median, 10s timeout per source |
| **RedStone** LTV oracle | live | `tests/redstone-ltv.spec.ts`, integrated via `init-trdc-and-oracle.ts` |
| **Pyth** | candidate | Multi-oracle posture; production source pinned post-hackathon |
| **Bubblegum cNFTs** | live | Real mints visible on Solana Explorer compressed-NFT viewer |
| **Kamino V2 + Loopscale** | partner rails | Curated lending; on-chain integration via composable CPI; UI in `/lend/vaults` |
| **Solana Pay QR codes** | live | `GET/POST /api/solana-pay/[kind]/[trdc]` for pay/repay/renew |
| **gov.br ID mock** | live mock | `?mock=auto` completes ~2s; real OAuth deferred to BR-entity registration |
| **`/admin/demo` cockpit** | live | 6 big buttons + accelerate-time toggle; Moment 06 (default + auction) runs full sequence ~10s with `fast=true` |
| **`/admin/tests` SSE runner** | live | Spawns `anchor test --skip-build`, ANSI-coloured live output, static replay fallback |

---

## Demo video — shot-by-shot script

**Total: 2:45**. Voice-over speaker = **Edson** (or any team member ≠ George — different voice from the pitch video).

### Shot 1 — Solana Explorer + the atomic invariant (0:00–0:30) — 30s

**Screen:**
Open Solana Explorer with the four Vaulx program IDs visible in tabs (vault / loan / trdc / auction) on Devnet. On-screen overlay text in upper-left corner:

> **Vaulx — 4 Anchor programs · Devnet · Live**

Quick zoom into the `loan` program's recent transactions list. Highlight one historical `confirm_custody` tx in the list, click it. The transaction shows **two events emitted in a single transaction**: `CustodyConfirmed` and `Disbursed`. Pause the camera here for ~3 seconds.

Overlay the killer line, large gold serif:

> **No USDC disburses until the licensed custodian's keypair signs custody-confirmation — atomically, in the same transaction.**

Below, a small comparison strip:
> *Aave · Maple · Centrifuge — none have shipped this for physical collateral.*

**Voice-over:**
> Vaulx is four Anchor programs live on Solana Devnet. The architectural decision that defines the protocol is this: no USDC ever disburses until the licensed custodian's keypair signs custody-confirmation, atomically, in the same transaction. Two events, one signature, deterministic. No middleman. No competitor — Aave, Maple, Centrifuge — has shipped this on-chain for physical collateral. Let me show you the build.

**Devnet event:** real historical tx, real explorer link visible the entire shot.

---

### Shot 2 — `/admin/demo` cockpit + Moment 1 deposit (0:30–0:50) — 20s

**Screen:**
Cut to `vaulx.vercel.app/admin/demo`. The cockpit shows 6 big buttons in a 3×2 grid + accelerate-time toggle (off) + status log on the right.

Click **Moment 01 — Seed pool**. Status log streams: lender deposits 100k USDC into `Vault`, `Deposited` event indexed, dashboard updates.

Cut briefly to `/lend/vaults/[id]` — the vault now shows TVL = $100k.

**Voice-over:**
> The whole flow runs from a built admin cockpit. Moment one: a lender deposits a hundred thousand USDC into the vault. The on-chain `Deposited` event lands; the indexer parses it; the lender dashboard updates in seconds. Solana finality at four hundred milliseconds.

---

### Shot 3 — Moment 2 mint + Moment 3 confirm-custody atomic (0:50–1:25) — 35s

**Screen:**
Back to `/admin/demo`. Click **Moment 02 — Mint TRDC cNFT**. Status log: borrower wallet pre-funded → 3-source appraisal API hit → median price returned → `create_ccb_trdc` invoked with LTV gate → CPI into `trdc.initialize_trdc_state` + `trdc.mint_trdc_cnft` → `TrdcState` in PendingCustody → cNFT minted. Quick cutaway to Solana Explorer compressed-NFT view of the new TRDC asset.

Click **Moment 03 — Confirm custody**. Status log: custodian webhook → bridge calls `loan.confirm_custody` → **atomic**: emits `CustodyConfirmed` + `DisburseRequested` + `Disbursed` in one tx → `TrdcState` transitions PendingCustody → ActiveInCustody → Active → USDC lands in borrower wallet.

Cut to Solana Explorer: show the `confirm_custody` tx page with all three events visible.

**Voice-over:**
> Moment two mints the TRDC compressed NFT. The borrower's CCB document hash, appraisal value, and rate are all on-chain. The cNFT cost a fraction of a cent — luxury at global scale only became economically viable on Solana. Moment three is the killer. The custodian signs custody-confirmation, and the same transaction emits three events: custody confirmed, disbursement requested, USDC disbursed. Two-layer gate enforces it: the loan-authority PDA must sign the disburse CPI, and the instructions sysvar verifies the top-level tx is from the loan program. Trust-minimized at the protocol level, not in a process document.

**Devnet events:** 5 sequential txns, all real, all visible.

---

### Shot 4 — LP cutaway: `/lend/auctions` + Solana Pay QR (1:25–1:50) — 25s

**Screen:**
Switch to `/lend/auctions` ("The Foreclosure Floor"). Show: live countdown timer on an active mock auction, bid history, min-bid-aware form. This is real production UI rendering on-chain state via the indexer.

Quick cut to a phone (mocked iPhone frame) showing a Solana Pay QR code from `/borrow/loans/[trdc]/repay`. The QR encodes a `solana:` deep-link to the repay tx.

**Voice-over:**
> Lender side: "The Foreclosure Floor" — a built page, live data via indexer, real-time countdowns. Per-asset transparency, every loan, every LTV. And on the borrower side, Solana Pay QR codes for installment, renewal, and repayment. Tap to repay from any Solana wallet. UX of an on-chain protocol, not a form.

---

### Shot 5 — Moment 6 default + auction + 45+ tests (1:50–2:25) — 35s

**Screen:**
Back to `/admin/demo`. Toggle **accelerate-time = ON**. Click **Moment 06 — Default + auction**. Status log streams the full sequence in ~10s: `execute_af_default` (3-day grace skipped via fast toggle) → trdc transitions Active → Overdue → Defaulted → `create_auction` → `place_bid` → `close_auction` → `record_auction_inflow` → vault gets the proceeds back.

Cut to `/admin/tests` SSE runner. Click Run. Show the live ANSI-coloured `anchor test --skip-build` output streaming. Land on the green summary line: **N/N tests passing** (capture the actual current count on recording day).

**Voice-over:**
> Moment six runs the full default-and-auction flow in ten seconds. Permissionless `execute_af_default` after a three-day grace, on-chain Dutch auction, proceeds returned to lenders via a separately-gated `record_auction_inflow`. Then a built test runner — server-sent events, live ANSI output. [Read the test count off the screen.] tests passing. The whole protocol covered.

---

### Shot 6 — Stack + decisions & tradeoffs (2:25–2:45) — 20s

**Screen:**
Final architecture diagram. Highlight (animated emphasis) on:

**Stack:**
- 4 programs · Anchor 0.30.1 · Rust + TS
- Crossmint · Civic Pass · Sumsub (native SAS, May 2025) · RedStone + Pyth · Bubblegum · Kamino V2 + Loopscale
- Indexer + bridge + Supabase events log

**Decisions and tradeoffs:**
- **cNFT vs Metaplex Core**: Bubblegum state compression for sub-cent mints — luxury at global scale only economical on Solana
- **Custodian keypair on-chain (in `LoanConfig`)** vs off-chain ACL: removes any Vaulx-operator trust assumption
- **2-layer disburse gate** (loan_authority PDA + sysvar check): structural, not procedural
- **USDC-primary, BRL UX wrapper**: isolates LPs from FX volatility

Bottom line, large gold: **github.com/Vaulxfi · Devnet live · `anchor test` · `/admin/demo`**

**Voice-over:**
> Stack: four Anchor programs, Civic plus Sumsub for KYC with native SAS attestations, RedStone and Pyth multi-oracle, Bubblegum cNFTs, Kamino and Loopscale composable rails. The two design choices judges should remember: the custodian keypair lives in on-chain config — no operator trust — and the disburse gate is two-layer at the protocol level. Repo's public. Anchor test green. Vaulx — the rail.

---

## Acceptance criteria — what "done" means

For each shot, the recording is acceptable when:

| Shot | Acceptance |
|---|---|
| 1 | All four program IDs visible on Solana Explorer; one historical `confirm_custody` tx clicked, both `CustodyConfirmed` + `Disbursed` events visible in same tx |
| 2 | `/admin/demo` cockpit renders; Moment 01 fires; vault TVL updates within 5s |
| 3 | Moments 02 + 03 run sequentially; cNFT visible on Solana Explorer compressed-NFT viewer; atomic `confirm_custody` tx page shows the 3 events |
| 4 | `/lend/auctions` renders with live countdown; Solana Pay QR scans on a phone wallet (or test on a desktop wallet showing the deep-link decode) |
| 5 | Moment 06 completes in <12s with `fast=true`; `/admin/tests` SSE runner shows green summary line |
| 6 | Stack + tradeoffs slide exported; final shot ≤20s |

End-to-end smoke test before recording: complete all 6 moments via `/admin/demo` in under 90 seconds (with `fast=true`), confirming every step works.

---

## Recording notes

- Record at **1920×1080 @ 60fps**, voice on a separate track for clean editing.
- Use a **single browser profile** with admin cookie pre-set; pre-fund all demo wallets.
- **Show Solana Explorer at least 4 times** — it's the technical-credibility signal.
- Voice-over speaker: **Edson** or another technical team member, not George (who's on the pitch video).
- Outro card 5 seconds: `vaulx.vercel.app · github.com/Vaulxfi · Solana Devnet · Colosseum 2026`.
- If anything fails live, swap to the static `apps/web/public/demo/test-run.log` replay or pre-recorded clip — but **never fake a tx that didn't happen**. Honest scope > fake polish.

---

## Risk register

| Risk | Mitigation |
|---|---|
| Devnet RPC flaky during recording | Use Helius RPC if available; fall back to public Devnet; record from `/admin/demo` log if a live tx times out |
| `/admin/demo` Moment 06 default-auction race condition | Re-run `Reset` then re-fire; built into the cockpit |
| Solana Pay QR decode fails on iPhone wallet | Have a desktop wallet open as fallback to show the deep-link decode |
| Bubblegum cNFT view loads slowly on Explorer | Pre-load the URL before recording |
| Anchor test count appears lower than baseline | Re-run from clean target; verify `pnpm anchor:test` returns the highest number |
| Voice-over doesn't fit 2:45 | Shot 5 is the most cuttable (drop `/admin/tests` segment to 8s); shot 3 next |

---

## Open items requiring user action (pre-recording)

1. **Flip `github.com/Vaulxfi/...` repo to PUBLIC** before submission. Open-source criterion is mandatory.
2. **Run `pnpm anchor:test` once** on recording day — capture the exact current pass count (likely >45 given recent Civic admin ixs + Sumsub helper landed).
3. **Verify Crossmint Devnet stability** the morning of recording — pre-record a fallback 8-second login clip in case the live login is flaky.
4. **Confirm at least one custodian + one curator partnership status** before stating "active conversations" anywhere on-screen — pitch slide 7 carries this claim.
5. **Pre-fund all demo wallets** with Devnet SOL via the cockpit `Reset` flow the morning of recording.
6. **Check Solana Pay QR end-to-end on a real phone** with a Solana wallet 24 hours before recording — this is the one mobile-side beat.
7. **Confirm Sumsub × SAS integration date** ("May 2025") on Sumsub's official press page before saying it on camera.

---

## Mapping to Colosseum's 6 judging criteria

| Criterion | Where this demo lands it |
|---|---|
| **Functionality** | Shot 1 (Solana Explorer + 4 program IDs), Shot 5 (`/admin/tests` SSE green) |
| **Potential Impact** | Pitch video carries this; demo only references in shot 6 outro |
| **Novelty** | Shot 1 (atomic confirm-and-disburse invariant, named-competitor comparison) |
| **UX** | Shot 2 (Crossmint social login), Shot 4 (Solana Pay QR + live `/lend/auctions`), Shot 5 (10-second full default-auction via cockpit) |
| **Open-source** | Outro card lists `github.com/Vaulxfi`; verify public before recording |
| **Business Plan** | Pitch video carries this; demo references in shot 6 ("USDC-primary isolates LPs from FX") |
