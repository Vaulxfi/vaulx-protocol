<div class="bg-mesh">

<div class="blob" style="width:500px;height:500px;top:-150px;right:-100px;background:rgba(56,189,248,0.05);animation:drift 16s ease-in-out infinite;">

</div>

<div class="blob" style="width:450px;height:450px;bottom:-120px;left:-80px;background:rgba(34,197,94,0.04);animation:drift 20s ease-in-out infinite reverse;">

</div>

<div class="blob" style="width:300px;height:300px;top:45%;left:45%;background:rgba(201,168,76,0.04);animation:drift 12s ease-in-out infinite;">

</div>

</div>

<div class="slide">

<div class="header">

<div style="display:flex;align-items:center;gap:14px;">

<span class="logo">Vaulx</span> <span class="header-title">Two-Sided RWA Credit Market · Platform Architecture</span>

</div>

<div class="header-right">

<span class="tag tag-demand">↓ Demand: Asset-rich Borrowers</span> <span class="tag tag-supply">↑ Supply: Yield-seeking Capital</span> <span class="tag tag-gold">⛓ Solana · Anchor · v3.1</span>

</div>

</div>

<div class="main">

<div class="swimlane demand-lane">

<div class="lane-label">

<span class="lane-label-text">Demand Side — Borrower</span> <span class="lane-label-sub">Asset-rich, credit-excluded · Luxury watch → stablecoin in \<10 min</span>

</div>

<div class="flow-row">

<div class="step-card">

<div class="step-num">

D1 · Onboard

</div>

<div class="step-name">

Identity & Wallet

</div>

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">🔵</span>

<div>

<div class="plugin-name">

Civic Pass

</div>

<div class="plugin-role">

KYC gate in 60s

</div>

</div>

<div class="tooltip">

**Civic Pass**On-chain KYC attestation tied to wallet. Vault Program's depositcapital requires valid pass. Cross-platform — Coinbase/Binance attestations recognized instantly.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🌐</span>

<div>

<div class="plugin-name">

Crossmint

</div>

<div class="plugin-role">

Custodial wallet + fiat

</div>

</div>

<div class="tooltip">

**Crossmint**Custodial wallet infra + fiat on-ramp. Mints NFTs to email/social wallets — no Web3 UX friction for non-crypto-native borrowers.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">📱</span>

<div>

<div class="plugin-name">

LazorKit

</div>

<div class="plugin-role">

FaceID / passkey txns

</div>

</div>

<div class="tooltip">

**LazorKit**Passkey-based wallet signing. Borrowers sign transactions with FaceID — no seed phrases. Critical for Phase 2 mass-market reach.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div>

<div class="plugin-name">

Privy

</div>

<div class="plugin-role">

Embedded wallet SDK

</div>

</div>

<div class="tooltip">

**Privy**Embedded wallet + social login. Hides blockchain complexity behind familiar banking UX — Phase 2 mobile app layer.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">📊</span>

<div>

<div class="plugin-name">

Chrono24 / WatchCharts

</div>

<div class="plugin-role">

M6 market anchor

</div>

</div>

<div class="tooltip">

**Chrono24 / WatchCharts**Real-time secondary market prices for 500K+ watch references. M6 90-day avg is the independent 3rd check — appraisers never see it during assessment, eliminating anchoring bias.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🔮</span>

<div>

<div class="plugin-name">

RedStone / Pyth

</div>

<div class="plugin-role">

On-chain price oracle

</div>

</div>

<div class="tooltip">

**RedStone / Pyth**Wrap luxury asset valuations into Solana-native oracle feeds. Also used for BRL stablecoin depeg monitoring (auto-pause if \>3% deviation).

</div>

</div>

<div class="plugin">

<span class="plugin-icon">📋</span>

<div>

<div class="plugin-name">

Blinded Appraiser Oracle

</div>

<div class="plugin-role">

3-party anti-collusion

</div>

</div>

<div class="tooltip">

**Blinded Appraiser Oracle**3 valuations in parallel — online (24h), offline specialist (48h), automated market anchor. Convergence logic flags collusion patterns automatically. ±10% median = accepted.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🔗</span>

<div>

<div class="plugin-name">

IPFS / Arweave

</div>

<div class="plugin-role">

Appraisal hash → TRDC

</div>

</div>

<div class="tooltip">

**IPFS / Arweave**Appraisal reports + photos pinned permanently. Content hash stored in TRDC cNFT metadata (asseturi field) — tamper-evident, immutable proof of asset condition at origination.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">🔒</span>

<div>

<div class="plugin-name">

Brinks / Proseguro / Loomis

</div>

<div class="plugin-role">

Licensed vault operator

</div>

</div>

<div class="tooltip">

**Brinks / Proseguro / Loomis**Tier-1 physical vault operators in São Paulo. Sign confirmCustody on-chain after verifying asset. Their signature is the ONLY trigger that unlocks disbursement.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏢</span>

<div>

<div class="plugin-name">

Gitel (IoT overlay)

</div>

<div class="plugin-role">

CCTV + tamper sensors

</div>

</div>

<div class="tooltip">

**Gitel**Marcelo's custody infrastructure — IoT/CCTV overlay on vault operators. National Brazil coverage, existing bank relationships. Operational moat = 18-24 months to replicate.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏦</span>

<div>

<div class="plugin-name">

SCD Partner + CCB

</div>

<div class="plugin-role">

Formal creditor of record

</div>

</div>

<div class="tooltip">

**SCD (Sociedade de Crédito Direto)**Licensed partner issues CCB with fiduciary alienation under BACEN Res. 4.656. Vaulx is the tech layer — SCD is the legal wrapper. CCB hash encoded in TRDC metadata.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">🗜️</span>

<div>

<div class="plugin-name">

Metaplex Bubblegum cNFT

</div>

<div class="plugin-role">

TRDC — 2400× cheaper

</div>

</div>

<div class="tooltip">

**Metaplex Bubblegum v2**TRDC minted as compressed NFT on Solana. 2,400× cheaper than standard NFT at scale. Encodes: ccbHash, LTV, status state machine, custodianId, vaultPubkey, maturityTs.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">💵</span>

<div>

<div class="plugin-name">

USDC / BRZ / BRLV

</div>

<div class="plugin-role">

Stablecoin disbursement

</div>

</div>

<div class="tooltip">

**USDC / BRZ / BRLV**Primary: USDC (deepest liquidity). BRZ (Transfero) as BRL-denominated option. Vault ATA balance drops on disbursement — only after custody gate clears.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">✍️</span>

<div>

<div class="plugin-name">

ICP-Brasil e-Sig

</div>

<div class="plugin-role">

ClickSign / D4Sign / BRy

</div>

</div>

<div class="tooltip">

**ICP-Brasil e-Signature**Legal digital signature on CCB by borrower + SCD. Standard BR fintech infrastructure. Minutes end-to-end. SHA-256 hash returned to Loan Program → TRDC metadata.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">💸</span>

<div>

<div class="plugin-name">

Quartz Off-Ramp

</div>

<div class="plugin-role">

USDC → BRL via PIX

</div>

</div>

<div class="tooltip">

**Quartz**USDC → BRL fiat offramp via PIX rails. Borrower receives/repays in BRL without managing stablecoins directly — removes the biggest UX barrier for Brazilian mass market.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🃏</span>

<div>

<div class="plugin-name">

Solflare Card / Lobster

</div>

<div class="plugin-role">

Spend stablecoin directly

</div>

</div>

<div class="tooltip">

**Solflare Card / Lobster.cash**Borrow against the Rolex, spend the USDC directly with a debit card. Reduces friction between crypto disbursement and real-world consumption.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">♻️</span>

<div>

<div class="plugin-name">

renewCCB (on-chain)

</div>

<div class="plugin-role">

Pay interest only, zero reappraisal cost

</div>

</div>

<div class="tooltip">

**renewCCB**ACTIVE→RENEWED→ACTIVE. Borrower pays accrued interest + signs amendment hash. No new appraisal, asset stays in custody. Drops variable cost by ~R\$670/event. The margin flywheel.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">⚖️</span>

<div>

<div class="plugin-name">

Auction PDA (3-tier)

</div>

<div class="plugin-role">

Privileged → open → auction house

</div>

</div>

<div class="tooltip">

**Auction PDA — 3-tier waterfall**1. Privileged 7-day window: current lenders + Felipe's reseller network at 15-20% below M3. 2. Open on-chain auction. 3. External BR luxury auction houses (Christies, Sothebys). 90%+ recovery modeled.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div>

<div class="plugin-name">

SCD Extrajudicial Recovery

</div>

<div class="plugin-role">

DL 911/69 — no court needed

</div>

</div>

<div class="tooltip">

**SCD Extrajudicial Recovery**Decreto-Lei 911/69 + CNJ Prov. 196/2025. Creditor acts without court involvement for fiduciary alienation. Squads 2/3 multisig calls executeAfDefault after extrajudicial process.

</div>

</div>

</div>

</div>

</div>

</div>

<div class="spine">

<span class="spine-label">⚓ VAULX CORE — 1 audited Anchor program</span>

<div class="spine-vaults">

<span class="vault-pill">Inst-USDC</span> <span class="vault-pill">Inst-BRL</span> <span class="vault-pill">Retail-FIDC-USDC</span> <span class="vault-pill">Retail-FIDC-BRL</span>

</div>

<span class="spine-invariant">require!(custody_confirmed ∧ terms_accepted) — the moat</span>

</div>

<div class="swimlane supply-lane">

<div class="flow-row">

<div class="step-card">

<div class="step-num">

S1 · Onboard

</div>

<div class="step-name">

Lender Identity & Compliance

</div>

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">🔵</span>

<div>

<div class="plugin-name">

Civic (accredited tier)

</div>

<div class="plugin-role">

KYC for institutional LPs

</div>

</div>

<div class="tooltip">

**Civic Pass — Institutional**Separate credential tier for institutional depositors. Vault Program checks pass on depositcapital. Whitelisted multisig for institutional wallets as alternative gate.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div>

<div class="plugin-name">

Tokeny / ERC-3643

</div>

<div class="plugin-role">

Compliant security wrapper

</div>

</div>

<div class="tooltip">

**Tokeny / ERC-3643**T-REX standard for compliant tokenized securities. Wraps institutional capital with transfer restrictions, investor whitelisting, and jurisdiction-aware compliance logic for LP tokens.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🇧🇷</span>

<div>

<div class="plugin-name">

FIDC Wrapper (CVM Res.175)

</div>

<div class="plugin-role">

BR retail securitization

</div>

</div>

<div class="tooltip">

**FIDC — Fundo de Investimento em Direitos Creditórios**CVM Res. 175 regulated fund. Retail lenders buy tokenized FIDC quotas. Fund administrator (Vortx/Oliveira Trust/Singulare) reconciles and registers quotaholders. FIDC = single institutional depositor into Retail-FIDC vaults.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">💎</span>

<div>

<div class="plugin-name">

4 Vaulx Vaults

</div>

<div class="plugin-role">

Pick risk/currency profile

</div>

</div>

<div class="tooltip">

**4-Vault Architecture**Same Anchor program code, 4 deployments. PDA seeds: \[b"vault_state", tokenMint.key, authority.key\]. Lenders self-select risk: institutional vs retail-FIDC, USDC vs BRL. One audit covers all 4.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">📊</span>

<div>

<div class="plugin-name">

LTV Oracle (live)

</div>

<div class="plugin-role">

Chrono24 + RedStone on-chain

</div>

</div>

<div class="tooltip">

**Live LTV Oracle**Real-time portfolio health visible to lenders. Chrono24 prices wrapped via RedStone → Solana. BRL depeg monitor (Pyth, 5-min interval) — auto-pauses BRL vaults if \>3% deviation.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">🌊</span>

<div>

<div class="plugin-name">

Kamino Finance

</div>

<div class="plugin-role">

Idle float → 5–6.5% APY

</div>

</div>

<div class="tooltip">

**Kamino Finance**\$3.2B TVL on Solana. Idle vault capital (10-20% float between disbursements) deployed into Kamino USDC vaults. At \$5M TVL, 15% float = \$120-200K/yr passive yield to protocol.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🌐</span>

<div>

<div class="plugin-name">

Plume Network

</div>

<div class="plugin-role">

TradFi capital → Vaulx vaults

</div>

</div>

<div class="tooltip">

**Plume Network**RWA-native chain. Institutional TradFi capital tokenized via Plume's Nest product routes into Vaulx vaults. Bridges traditional asset managers into Solana-native yield.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏦</span>

<div>

<div class="plugin-name">

SCD Balance Sheet

</div>

<div class="plugin-role">

Phase 0 originator capital

</div>

</div>

<div class="tooltip">

**SCD Phase 0 Capital**Partner SCD provides pilot liquidity under the revenue-share agreement. Acts as both licensed partner AND first institutional depositor — aligns incentives perfectly for Phase 0 launch.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">📈</span>

<div>

<div class="plugin-name">

~11% APY USDC

</div>

<div class="plugin-role">

~14% APY BRL

</div>

</div>

<div class="tooltip">

**Yield Structure**Borrower pays 2.2%/month (26.4% APR). Lenders earn 11% APY USDC / ~14% BRL. Net platform spread 4-6% annualized. Share-based: yield accrues as repayments increase vault's totalDeposited — pro-rata to all LPs automatically.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🛡️</span>

<div>

<div class="plugin-name">

50-60% LTV Floor

</div>

<div class="plugin-role">

90%+ recovery on default

</div>

</div>

<div class="tooltip">

**LTV Security Buffer**Max LTV 60% hard-coded in Anchor (maxLtvBps ≤ 7500, enforced at createCCBTRDC). Physical collateral at 50-60% LTV → 90%+ modeled recovery even on forced sale. vs. 8.3% avg recovery for unsecured on-chain credit.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">🎯</span>

<div>

<div class="plugin-name">

Privileged Auction

</div>

<div class="plugin-role">

72h first-look at 15-20% discount

</div>

</div>

<div class="tooltip">

**Privileged Auction — Lender Flywheel**Default is NOT a loss event for active lenders — it's optionality. 7-day window: current LPs + Felipe's 20-reseller network get first bid at 15-20% below M3 median. Turns default into yield-plus-asset-acquisition.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🔒</span>

<div>

<div class="plugin-name">

Squads 2/3 Multisig

</div>

<div class="plugin-role">

executeAfDefault gate

</div>

</div>

<div class="tooltip">

**Squads Multisig**L1 admin tier. 2-of-3 required for executeAfDefault, vault pause, critical param changes. 48h timelock on SCD authority changes. Withdrawal \>10% TVL has 24h timelock.

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

<div class="plugin-list">

<div class="plugin">

<span class="plugin-icon">🔄</span>

<div>

<div class="plugin-name">

Loopscale

</div>

<div class="plugin-role">

TRDC secondary market

</div>

</div>

<div class="tooltip">

**Loopscale**TRDC positions tradeable on Loopscale's RWA secondary market. Provides liquidity exit for lenders without waiting for loan maturity — solves the liquidity mismatch problem for institutional LPs.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">⚡</span>

<div>

<div class="plugin-name">

Jupiter Aggregator

</div>

<div class="plugin-role">

Vault share token liquidity

</div>

</div>

<div class="tooltip">

**Jupiter**Phase 2: vault share SPL tokens listed on Jupiter. LPs can exit at market price without waiting for redemption queue. Composability = Vaulx positions usable as collateral in broader Solana DeFi.

</div>

</div>

<div class="plugin">

<span class="plugin-icon">🏛️</span>

<div>

<div class="plugin-name">

OCC / Nest (Plume)

</div>

<div class="plugin-role">

Institutional regulated exit

</div>

</div>

<div class="tooltip">

**OCC / Plume Nest**Regulated exit rails for institutional capital. OCC-compliant custody wrapper for US institutional LPs. Plume Nest handles tokenized TradFi capital redemption back to fiat rails.

</div>

</div>

</div>

</div>

</div>

<div class="lane-label" style="margin-top:2px;">

<span class="lane-label-text">Supply Side — Liquidity Provider</span> <span class="lane-label-sub">Institutional SCDs · Family offices · DeFi funds · Retail via FIDC</span>

</div>

</div>

</div>

<div class="footer">

<div class="f-item">

<div class="f-dot" style="background:var(--demand);">

</div>

Demand / Borrower flow

</div>

<div class="f-item">

<div class="f-dot" style="background:var(--supply);">

</div>

Supply / Lender flow

</div>

<div class="f-item">

<div class="f-dot" style="background:var(--accent);">

</div>

Anchor core (spine)

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

<div class="f-item" style="color:var(--text2);font-size:0.5rem;">

💡 Hover any partner for role detail

</div>

<span class="f-note">Platform, not balance-sheet lender · Both sides funded by 3rd-party rails · 1 program audit = 4 vaults</span>

</div>

</div>
