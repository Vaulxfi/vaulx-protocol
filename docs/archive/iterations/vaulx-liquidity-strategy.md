<div class="hero">

<div class="hero-eyebrow">

Internal Reference · April 2026

</div>

# Neither Kamino nor Plume brings you liquidity.

They provide infrastructure. You provide collateral, track record, and the first 2–3 lender relationships. Here is the full partner map.

</div>

<div class="callout callout-primary">

<div class="callout-label">

Core finding

</div>

**Kamino** is a credit marketplace — existing curators (Re7 Labs, MEV Capital, Steakhouse, Allez) allocate their own depositors' capital into markets they choose. They pick Vaulx if yield is competitive and collateral is trusted. **Plume Nest** distributes institutional capital into Plume's own vaults — not third-party protocols. Both are venues, not balance sheets.

</div>

------------------------------------------------------------------------

<div class="section">

<div class="section-head">

<div class="tier-label tier-1">

Tier 1 — Launch (NOW)

</div>

## Isolated market + vault curator

Low governance friction. Custom LTV and cNFT liquidation logic. Requires convincing one curator to allocate.

</div>

<div class="partner-grid">

<div class="partner-card">

<div class="pc-top">

<div class="pc-name">

Loopscale

</div>

<span class="pc-badge badge-now">NOW · Best fit</span>

</div>

<div class="pc-role">

Order-book credit market · Solana-native

</div>

<div class="pc-desc">

Launched first BRL credit market on Solana (Transfero BRZ × Etherfuse TESOURO). First permissioned RWA product using Apollo's ACRED. No governance vote — needs only an oracle and initial liquidity to open a market.

</div>

<div class="pc-what">

**You bring:** cNFT appraiser oracle, watch-collateral spec, 1 anchor lender\
**They bring:** order-book venue, BRZ/USDC rails, bilateral lender matching

</div>

</div>

<div class="partner-card">

<div class="pc-top">

<div class="pc-name">

Kamino V2 (Curator)

</div>

<span class="pc-badge badge-now">NOW · Parallel</span>

</div>

<div class="pc-role">

Pool-based lending · \$2.45B TVL

</div>

<div class="pc-desc">

Isolated market architecture with custom LTV and liquidation hooks. Curator model: Re7 Labs and MEV Capital manage USDC pools and allocate across approved markets on behalf of their LPs.

</div>

<div class="pc-what">

**You bring:** competitive yield, zero-bad-debt track record\
**They bring:** market structure, user base, curator distribution

</div>

</div>

</div>

</div>

<div class="section">

<div class="section-head">

<div class="tier-label tier-2">

Tier 2 — Launch (PARALLEL)

</div>

## Brazilian institutional capital

The anchor lenders. These are distribution channels and balance-sheet providers, not protocols.

</div>

<div class="partner-grid">

<div class="partner-card">

<div class="pc-top">

<div class="pc-name">

Mercado Bitcoin

</div>

<span class="pc-badge badge-parallel">Parallel</span>

</div>

<div class="pc-role">

Brazil's largest crypto exchange · MB Tokens

</div>

<div class="pc-desc">

Regulated securities arm (MB Digital Assets). Established HNW retail + institutional base that already holds physical luxury assets. Natural lender base for a watch-backed CCB product.

</div>

<div class="pc-what">

**Deal structure:** MB allocates a USDC/BRZ lending vault into Loopscale or Kamino Vaulx market, earns yield on float. Their users = primary lender segment.

</div>

</div>

<div class="partner-card">

<div class="pc-top">

<div class="pc-name">

Transfero Group

</div>

<span class="pc-badge badge-parallel">Parallel</span>

</div>

<div class="pc-role">

BRZ issuer · Active in Solana RWA stack

</div>

<div class="pc-desc">

Issued BRZ, already live in Loopscale's first BRL credit market. Deep Brazilian regulatory relationships and institutional network. Understands CCB legal structure.

</div>

<div class="pc-what">

**Deal structure:** BRZ liquidity provision + co-regulatory facilitation. Bridge to CVM and BACEN dialogue.

</div>

</div>

<div class="partner-card">

<div class="pc-top">

<div class="pc-name">

Credora / Maple Finance

</div>

<span class="pc-badge badge-alt">Alt</span>

</div>

<div class="pc-role">

Crypto-native credit funds

</div>

<div class="pc-desc">

Maple's syrupUSDC seeded \$30M on Kamino with \$500K in incentives at launch. Credora provides on-chain credit risk scoring. Both understand novel collateral types.

</div>

<div class="pc-what">

**Deal structure:** Maple pool manager allocates into Vaulx Kamino market. Credora provides borrower risk layer for institutional lenders.

</div>

</div>

</div>

</div>

<div class="callout callout-warning">

<div class="callout-label">

Why not Aave

</div>

Aave is EVM-native, governed by a large DAO with a slow asset onboarding process (months of governance proposals to whitelist novel collateral). No Brazil-specific liquidity, no RWA expertise, no Solana integration. Wrong venue for launch phase.

</div>

------------------------------------------------------------------------

<div class="section">

<div class="section-head">

## Off-ramp clarification: Privy vs. Quartz

These are not competing options. One is the UX host, the other is the settlement rail.

</div>

<div class="split-row">

<div class="split-card">

<div class="split-role-tag tag-host">

Host layer

</div>

<div class="split-name">

Privy

</div>

<div class="split-desc">

Wallet + auth layer. Surfaces ramp widgets inside your app without the user leaving. Native partners: MoonPay, Bridge (Stripe), Coinbase Onramp, Transak. Since Stripe acquired Privy (June 2025), Bridge stablecoin rails are the preferred path. Does *not* handle fiat movement natively.

</div>

</div>

<div class="arrow-connector">

↓

</div>

<div>

<div class="split-card-inner" style="margin-block-end:var(--space-3)">

<div class="split-role-tag tag-rail">

Settlement rail

</div>

<div class="split-name">

Quartz

</div>

<div class="split-desc">

Solana-native USDC→BRL/PIX. Built specifically for this corridor. Runs inside Privy's widget layer.

</div>

</div>

<div class="split-card-inner">

<div class="split-role-tag tag-alt">

Alt rail

</div>

<div class="split-name">

Ramp Network

</div>

<div class="split-desc">

Also supports PIX. Pluggable into Privy as a custom provider. Fallback if Quartz partnership stalls.

</div>

</div>

</div>

</div>

</div>

------------------------------------------------------------------------

<div class="section">

<div class="section-head">

## Phased liquidity stack

The first \$5–10M comes from 2–3 manually closed relationships, not protocol TVL.

</div>

<div class="phase-table-wrap">

| Phase | Partner | What they provide | What you provide |
|----|----|----|----|
| Launch | Loopscale | Order-book venue, BRZ/USDC rails, no governance friction | Appraiser oracle, cNFT spec, anchor lender |
| Launch | Re7 / MEV Capital (curator) | Managed USDC pool allocated to Vaulx market | Competitive yield vs. Maple/OnRe |
| 6 months | Mercado Bitcoin / Transfero | BRL institutional lender base, regulatory credibility | Revenue share, co-marketing, regulatory facilitation |
| Phase 2 | Kamino V2 RWA market | Scale venue with \$2.45B TVL base | Track record, zero-bad-debt history |
| Phase 2 | Plume Nest | Institutional investor distribution across chains | Established protocol metrics, Plume partnership deal |

</div>

<div class="bottom-rule">

**The model:** Protocols provide infrastructure, not balance sheets. The launch capital comes from 2–3 manually closed relationships — one vault curator (Re7 / MEV Capital), one Brazilian institutional anchor (MB or Transfero), and optionally a crypto credit fund (Maple). Everything else scales on top of that foundation.

</div>

</div>
