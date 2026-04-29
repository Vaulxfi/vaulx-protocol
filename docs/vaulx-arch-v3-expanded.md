<div class="bg-mesh">

<div class="blob" style="width:500px;height:500px;top:-150px;right:-80px;background:rgba(56,189,248,0.04);animation:drift 18s ease-in-out infinite;">

</div>

<div class="blob" style="width:450px;height:450px;bottom:-120px;left:-80px;background:rgba(34,197,94,0.04);animation:drift 22s ease-in-out infinite reverse;">

</div>

<div class="blob" style="width:280px;height:280px;top:45%;left:42%;background:rgba(201,168,76,0.04);animation:drift 14s ease-in-out infinite;">

</div>

</div>

<div class="slide">

<div class="header">

<div style="display:flex;align-items:center;gap:12px;">

<span class="logo">Vaulx</span> <span class="header-title">Two-Sided RWA Credit Market · Platform Architecture · All Integrations</span>

</div>

<div class="header-right">

<span class="tag tag-d">↓ Demand: Borrowers</span> <span class="tag tag-s">↑ Supply: Capital</span> <span class="tag tag-g">⛓ Solana · Anchor · v3.1</span>

</div>

</div>

<div class="main">

<div class="lane-label demand-label">

<span class="lane-title">Demand Side — Borrower</span> <span class="lane-sub">Asset-rich, credit-excluded · Luxury watch → stablecoin in \<10 min · São Paulo Phase 0</span>

</div>

<div class="flow-row demand-row">

<div class="step-card">

<div class="step-num">

D1 · Onboard

</div>

<div class="step-name">

Identity & Wallet

</div>

<div class="plugin">

<span class="plugin-icon">🔵</span>

<div class="plugin-body">

<div class="plugin-name">

Civic Pass

</div>

<div class="plugin-why">

On-chain KYC tied to wallet. Vault Program requires valid pass on depositcapital. Cross-platform — Coinbase/Binance attestations recognized instantly; sub-3-min for new users.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🌐</span>

<div class="plugin-body">

<div class="plugin-name">

Crossmint

</div>

<div class="plugin-why">

Custodial wallet + fiat on-ramp. Mints NFTs to email/social wallets — removes Web3 friction for non-crypto-native borrowers entirely.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">📱</span>

<div class="plugin-body">

<div class="plugin-name">

LazorKit

</div>

<div class="plugin-why">

Passkey/FaceID wallet signing. No seed phrase. Borrowers sign Solana txns with biometrics — critical for Phase 2 mass-market UX.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div class="plugin-body">

<div class="plugin-name">

Privy

</div>

<div class="plugin-why">

Embedded wallet SDK + social login. Hides blockchain behind banking UX — Phase 2 mobile app, IBAN/PIX-alias deposit rails.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

D2 · Register

</div>

<div class="step-name">

Triangular Appraisal

</div>

<div class="plugin">

<span class="plugin-icon">📊</span>

<div class="plugin-body">

<div class="plugin-name">

Chrono24 / WatchCharts

</div>

<div class="plugin-why">

M6 market anchor — 90-day avg from 500K+ watch references. Independent 3rd check; appraisers never see it during assessment → eliminates anchoring bias.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🔮</span>

<div class="plugin-body">

<div class="plugin-name">

RedStone / Pyth

</div>

<div class="plugin-why">

Wrap luxury asset prices into Solana-native oracle feeds. Also: BRL depeg monitor every 5 min — auto-pauses BRL vaults if \>3% deviation (fail-closed).

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">📋</span>

<div class="plugin-body">

<div class="plugin-name">

Blinded Appraiser Oracle

</div>

<div class="plugin-why">

3 valuations in parallel — online 24h, offline specialist 48h, auto market anchor. ±10% median = accepted. Collusion-pattern alert if both humans diverge 20% from market.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🔗</span>

<div class="plugin-body">

<div class="plugin-name">

IPFS / Arweave

</div>

<div class="plugin-why">

Appraisal reports + 12-angle photos pinned permanently. SHA-256 hash stored in TRDC cNFT metadata (asseturi) — tamper-evident, immutable proof of asset condition at origination.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

D3 · Custody

</div>

<div class="step-name">

Physical Vault + CCB

</div>

<div class="plugin">

<span class="plugin-icon">🔒</span>

<div class="plugin-body">

<div class="plugin-name">

Brinks / Proseguro / Loomis

</div>

<div class="plugin-why">

Tier-1 licensed vault operators in São Paulo. Sign confirmCustody on-chain after verifying asset against appraisal. Their signature is the ONLY trigger that unlocks disbursement.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏢</span>

<div class="plugin-body">

<div class="plugin-name">

Gitel (IoT overlay)

</div>

<div class="plugin-why">

Marcelo's national custody infra — CCTV, tamper-evident seals, biometric access, bank-grade transport. Existing bank relationships. Takes 18–24 months + capex for any competitor to replicate.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏦</span>

<div class="plugin-body">

<div class="plugin-name">

SCD Partner + CCB

</div>

<div class="plugin-why">

Licensed SCD issues CCB with fiduciary alienation under BACEN Res. 4.656. Formal creditor of record. Vaulx = tech layer. CCB hash + external ID encoded in TRDC metadata.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">✍️</span>

<div class="plugin-body">

<div class="plugin-name">

ICP-Brasil e-Sig (ClickSign)

</div>

<div class="plugin-why">

Legal digital signature on CCB by borrower + SCD. Standard BR fintech infra. Minutes end-to-end. SHA-256 hash returned to Loan Program → TRDC metadata field ccbHash.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

D4 · Disburse

</div>

<div class="step-name">

TRDC Mint + Payout

</div>

<div class="plugin">

<span class="plugin-icon">🗜️</span>

<div class="plugin-body">

<div class="plugin-name">

Metaplex Bubblegum cNFT

</div>

<div class="plugin-why">

TRDC = compressed NFT. 2,400× cheaper than standard NFT at scale. Encodes: ccbHash, LTV, status state machine, custodianId, vaultPubkey, maturityTs. Non-transferable during active loan.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">💵</span>

<div class="plugin-body">

<div class="plugin-name">

USDC / BRZ / BRLV

</div>

<div class="plugin-why">

Primary: USDC (deepest liquidity, \$86B supply). BRZ (Transfero) for BRL-denominated vaults. Vault ATA balance drops on CPI disbursement — ONLY after custody gate clears.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div class="plugin-body">

<div class="plugin-name">

Tokeny / ERC-3643 (TRDC)

</div>

<div class="plugin-why">

T-REX compliance model for TRDC transfer restrictions. Non-transferable during active loan lifecycle — only authorized state transitions possible via Loan Program instructions.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

D5 · Manage

</div>

<div class="step-name">

Active Term UX

</div>

<div class="plugin">

<span class="plugin-icon">💸</span>

<div class="plugin-body">

<div class="plugin-name">

Quartz Off-Ramp

</div>

<div class="plugin-why">

USDC → BRL via PIX rails. Borrower receives/repays in BRL without managing stablecoins. Removes the biggest UX barrier for Brazilian mass market — invisible crypto.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🃏</span>

<div class="plugin-body">

<div class="plugin-name">

Solflare Card / Lobster

</div>

<div class="plugin-why">

Borrow against the Rolex, spend the USDC directly via debit card. Bridges crypto disbursement to real-world spending without any conversion step for the borrower.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🔔</span>

<div class="plugin-body">

<div class="plugin-name">

Day-60/90 Renewal Prompts

</div>

<div class="plugin-why">

In-app prompt at day 60 (intent capture) + early-renewal incentive at day 90 (10% fee reduction or 0.1%/mo rate concession). R\$62–93 cost vs R\$450 new-CAC — always deploy.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

D6 · Resolution

</div>

<div class="step-name">

Repay · Renew · Default

</div>

<div class="plugin">

<span class="plugin-icon">♻️</span>

<div class="plugin-body">

<div class="plugin-name">

renewCCB (Anchor)

</div>

<div class="plugin-why">

ACTIVE→RENEWED→ACTIVE. Pay interest only + sign amendment hash. No re-appraisal, asset stays in custody. Drops variable cost R\$670/event. The margin flywheel: C2+ cycles cost ~R\$0.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">⚖️</span>

<div class="plugin-body">

<div class="plugin-name">

Auction PDA (3-tier)

</div>

<div class="plugin-why">

1\) Privileged 7-day window: current LPs + Felipe's 20-reseller network at 15–20% below M3. 2) Open on-chain auction. 3) External BR luxury auction houses. 90%+ recovery modeled.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div class="plugin-body">

<div class="plugin-name">

SCD Extrajudicial Recovery

</div>

<div class="plugin-why">

DL 911/69 + CNJ Prov. 196/2025. Creditor acts without court for fiduciary alienation. Squads 2/3 multisig signs executeAfDefault after extrajudicial process completes.

</div>

</div>

</div>

</div>

</div>

<div class="spine">

<span class="spine-label">⚓ VAULX CORE — 1 audited Anchor program</span>

<div class="vault-pills">

<span class="vault-pill">Inst-USDC</span> <span class="vault-pill">Inst-BRL</span> <span class="vault-pill">Retail-FIDC-USDC</span> <span class="vault-pill">Retail-FIDC-BRL</span>

</div>

<span class="spine-inv">require!(custody_confirmed ∧ terms_accepted) — the moat · Squads 2/3 multisig · 48h timelock on critical params</span>

</div>

<div class="flow-row supply-row">

<div class="step-card">

<div class="step-num">

S1 · Onboard

</div>

<div class="step-name">

Lender Identity & Compliance

</div>

<div class="plugin">

<span class="plugin-icon">🔵</span>

<div class="plugin-body">

<div class="plugin-name">

Civic (accredited tier)

</div>

<div class="plugin-why">

Institutional KYC credential tier. Vault Program checks pass on depositcapital. Alternatively: whitelisted multisig for institutional wallets maintains legal compliance on-chain.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div class="plugin-body">

<div class="plugin-name">

Tokeny / ERC-3643 (LP)

</div>

<div class="plugin-why">

T-REX compliant security wrapper for LP tokens. Transfer restrictions, investor whitelisting, jurisdiction-aware compliance for tokenized FIDC quotas and institutional vault shares.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🇧🇷</span>

<div class="plugin-body">

<div class="plugin-name">

FIDC Wrapper (CVM Res.175)

</div>

<div class="plugin-why">

CVM-regulated fund. Retail lenders buy tokenized FIDC quotas. Fund admin (Vortx/Oliveira Trust/Singulare) reconciles deposits, registers quotaholders. FIDC = single institutional depositor in Retail-FIDC vaults.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

S2 · Allocate

</div>

<div class="step-name">

Vault Selection

</div>

<div class="plugin">

<span class="plugin-icon">💎</span>

<div class="plugin-body">

<div class="plugin-name">

4 Vaulx Vaults

</div>

<div class="plugin-why">

Same Anchor code, 4 deployments. PDA seeds: \[b"vault_state", tokenMint, authority\]. Self-select risk: institutional vs retail-FIDC, USDC vs BRL. One audit covers all 4 — no incremental cost.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">📊</span>

<div class="plugin-body">

<div class="plugin-name">

Live LTV Oracle

</div>

<div class="plugin-why">

Chrono24 prices wrapped via RedStone → on-chain. Portfolio LTV visible in real-time. BRL depeg via Pyth (5-min polling) — BRL vault auto-pauses if \>3% deviation; fail-closed if oracle unreachable 10 min.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

S3 · Deposit

</div>

<div class="step-name">

Capital Rails

</div>

<div class="plugin">

<span class="plugin-icon">🌊</span>

<div class="plugin-body">

<div class="plugin-name">

Kamino Finance

</div>

<div class="plugin-why">

\$3.2B TVL on Solana. Idle vault float (10–20% between disbursements) deployed into Kamino USDC vaults at 5–6.5% APY. At \$5M TVL + 15% float = \$120–200K/yr passive to protocol.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🌐</span>

<div class="plugin-body">

<div class="plugin-name">

Plume Network / Nest

</div>

<div class="plugin-why">

RWA-native chain. TradFi capital tokenized via Plume Nest routes into Vaulx vaults. Bridges institutional asset managers into Solana-native yield — supply-side GTM for US/EU capital.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏦</span>

<div class="plugin-body">

<div class="plugin-name">

SCD Balance Sheet

</div>

<div class="plugin-why">

Partner SCD provides Phase 0 pilot liquidity as part of revenue-share agreement. Acts as both licensed partner AND first institutional depositor — perfectly aligned incentives for launch.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

S4 · Earn

</div>

<div class="step-name">

Yield Mechanics

</div>

<div class="plugin">

<span class="plugin-icon">📈</span>

<div class="plugin-body">

<div class="plugin-name">

~11% APY USDC / ~14% BRL

</div>

<div class="plugin-why">

Borrower pays 2.2%/mo (26.4% APR). Lenders earn 11% USDC / 14% BRL. Net platform spread 4–6% annualized. Share-based: repayments increase vault totalDeposited → yield auto-accrues pro-rata.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🛡️</span>

<div class="plugin-body">

<div class="plugin-name">

50–60% LTV Floor

</div>

<div class="plugin-why">

maxLtvBps ≤ 7,500 hard-coded in Anchor. Physical collateral at 50–60% LTV → 90%+ modeled recovery on default. vs. 8.3% average recovery for unsecured on-chain credit (2020–2026 data).

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">💰</span>

<div class="plugin-body">

<div class="plugin-name">

Tiered Loyalty Pricing

</div>

<div class="plugin-why">

Cycle 1: base rate. Cycle 2: −0.1%/mo. Cycle 3+: −0.2%/mo. Signals long-term relationship value to borrowers → drives renewal rate from 52% to target 62%, compounding lender yield.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

S5 · Recoveries

</div>

<div class="step-name">

Default → Lender Upside

</div>

<div class="plugin">

<span class="plugin-icon">🎯</span>

<div class="plugin-body">

<div class="plugin-name">

Privileged Auction (7-day)

</div>

<div class="plugin-why">

Default = yield-plus-optionality, not loss. Current LPs + Felipe's 20-reseller network get first-bid window at 15–20% below M3 median. Buyer wins: resale profit or personal acquisition at discount.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🔒</span>

<div class="plugin-body">

<div class="plugin-name">

Squads 2/3 Multisig

</div>

<div class="plugin-why">

L1 admin: executeAfDefault, vault pause, critical param changes. 48h timelock on SCD authority. Withdrawal \>10% TVL has 24h timelock. Reentrancy guards on all disbursement ops.

</div>

</div>

</div>

</div>

<div class="step-card">

<div class="step-num">

S6 · Distribute

</div>

<div class="step-name">

Exit & Composability

</div>

<div class="plugin">

<span class="plugin-icon">🔄</span>

<div class="plugin-body">

<div class="plugin-name">

Loopscale

</div>

<div class="plugin-why">

TRDC positions tradeable on Loopscale's RWA secondary market. LP liquidity exit without waiting for loan maturity — solves the liquidity mismatch problem structurally for institutional capital.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">⚡</span>

<div class="plugin-body">

<div class="plugin-name">

Jupiter Aggregator

</div>

<div class="plugin-why">

Phase 2: vault share SPL tokens listed on Jupiter. LPs exit at market price without redemption queue. Composability: Vaulx positions become collateral across broader Solana DeFi ecosystem.

</div>

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div class="plugin-body">

<div class="plugin-name">

OCC / Plume Nest Exit

</div>

<div class="plugin-why">

OCC-compliant custody wrapper for US institutional LPs. Plume Nest handles tokenized TradFi capital redemption back to fiat rails — regulated exit for non-crypto-native asset managers.

</div>

</div>

</div>

</div>

</div>

<div class="lane-label supply-label">

<span class="lane-title">Supply Side — Liquidity Provider</span> <span class="lane-sub">SCDs · Family offices · DeFi funds · US/EU institutional · Retail via FIDC · Yield-seeking capital at 11–14% APY</span>

</div>

</div>

<div class="footer">

<div class="f-item">

<div class="f-dot" style="background:var(--demand);">

</div>

Demand / Borrower

</div>

<div class="f-item">

<div class="f-dot" style="background:var(--supply);">

</div>

Supply / Lender

</div>

<div class="f-item">

<div class="f-dot" style="background:var(--accent);">

</div>

Anchor core spine

</div>

<div class="f-item">

<div class="f-dot" style="background:var(--purple);">

</div>

Compliance / Legal

</div>

<div class="f-item">

<div class="f-dot" style="background:var(--teal);">

</div>

DeFi / Yield rails

</div>

<div class="f-item">

<div class="f-dot" style="background:var(--coral);">

</div>

Rails / Off-ramp

</div>

<span class="f-note">Platform, not balance-sheet lender · 3rd-party rails fund both sides · 1 program audit = 4 vaults · Solana Devnet → Mainnet Beta</span>

</div>

</div>
