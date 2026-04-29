<div class="container">

<div class="header">

# <span class="vaulx">VAULX</span> <span class="rest">— Two-sided RWA credit market on Solana</span>

Demand: asset-rich borrowers · Supply: yield-seeking capital · Custody-gated Anchor program at the core

</div>

<div class="divider">

</div>

<div class="lane-label">

DEMAND ▶ BORROWER JOURNEY <span class="legend">hover any partner for detail</span>

</div>

<div class="swimlane">

<div class="step-box c-purple">

<div class="step-header">

1 · ONBOARD

</div>

<div class="step-body">

<span class="partner">Civic <span class="tooltip">**Civic**Solana KYC + Token-2022 transfer-hook compliance. Production-ready, accepts gov-issued IDs (incl. BR docs).<span class="why">Why: 60-sec KYC; gates TRDC transfers to KYC'd wallets only.</span><span class="status">Target integration · v1</span></span> </span> <span class="partner">gov.br <span class="tooltip">**gov.br**Brazilian government digital ID. 170M+ enrolled users.<span class="why">Why: fastest BR-user onboarding + regulatory trust signal.</span><span class="status">Phase 1 · BR-specific</span></span> </span> <span class="partner">Crossmint <span class="tooltip">**Crossmint**Embedded smart wallets, Squads-secured (\$10B TVL).<span class="why">Why: email login → Solana wallet, no seed phrase, zero crypto knowledge required.</span><span class="status">Target integration · v1</span></span> </span> <span class="partner">LazorKit <span class="tooltip">**LazorKit**Passkey/FaceID Solana wallets via Apple Secure Enclave.<span class="why">Why: strongest UX moment in the demo — sign loan with biometrics.</span><span class="status">Target integration · v1</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

60-sec KYC + wallet for non-crypto users.

</div>

</div>

</div>

</div>

<div class="step-box c-orange">

<div class="step-header">

2 · REGISTER

</div>

<div class="step-body">

<span class="partner">Chrono24 <span class="tooltip">**Chrono24**World's largest luxury watch marketplace. ChronoPulse index covers 600K+ tx, 14 brands × 140 models.<span class="why">Why: real price data for our asset class — no other oracle has it.</span><span class="status">Apify scraper · Phase 0</span></span> </span> <span class="partner">WatchCharts <span class="tooltip">**WatchCharts**Watch market price aggregator with deep historical data.<span class="why">Why: cross-source price reference to validate Chrono24 feed.</span><span class="status">Scraper · Phase 0</span></span> </span> <span class="partner">RedStone <span class="tooltip">**RedStone**Solana RWA oracle, live since May 2025 (Securitize partnership).<span class="why">Why: wraps our Chrono24 data into a Solana-native oracle feed for on-chain LTV calc.</span><span class="status">Future partner · logo only at hackathon</span></span> </span> <span class="partner">Pyth <span class="tooltip">**Pyth Network**Solana's largest oracle network. Stablecoin and FX feeds.<span class="why">Why: USDC/BRL/USD price feeds for LTV calc and payout conversion.</span><span class="status">Live integration · v1</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

Real luxury price → Solana oracle feed.

</div>

</div>

</div>

</div>

<div class="step-box c-red">

<div class="step-header">

3 · CUSTODY

</div>

<div class="step-body">

<span class="partner">Brinks SP <span class="tooltip">**Brinks São Paulo**Global licensed custodian. SP vault operations.<span class="why">Why: physical vault for the watches — the off-chain custody leg of the gate.</span><span class="status">Target MOU · Marcelo</span></span> </span> <span class="partner">Prosegur <span class="tooltip">**Prosegur**Spanish-headquartered custodian, BR operations.<span class="why">Why: parallel candidate to Brinks — never bet on one.</span><span class="status">Target MOU · Marcelo</span></span> </span> <span class="partner">Loomis <span class="tooltip">**Loomis**Swedish-headquartered cash + valuables custodian.<span class="why">Why: third candidate, redundancy on supply.</span><span class="status">Target MOU · Marcelo</span></span> </span> <span class="partner">Gitel IoT <span class="tooltip">**Gitel**Marcelo's electronic-security integrator. 38 years, 60+ corporate clients (Gerdau, ArcelorMittal, SICOOB).<span class="why">Why: CFTV/IoT overlay on partner vaults — distinctive audit layer competitors can't replicate.</span><span class="status">Built-in · Marcelo's edge</span></span> </span> <span class="partner">SCD + CCB <span class="tooltip">**BACEN-licensed SCD + CCB**Sociedade de Crédito Direto signs Cédula de Crédito Bancário with fiduciary alienation.<span class="why">Why: legal counterparty — without it there is no loan, no product.</span><span class="status">Target LOI · Risk \#1</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

Licensed vault + IoT + legal fiduciary paper.

</div>

</div>

</div>

</div>

<div class="step-box c-green">

<div class="step-header">

4 · DISBURSE

</div>

<div class="step-body">

<span class="partner">USDC / BRZ <span class="tooltip">**USDC + BRZ**Circle USDC + Transfero BRZ — Solana stablecoins.<span class="why">Why: loan disbursement currency. Borrower picks USD or BRL exposure.</span><span class="status">Live · v1</span></span> </span> <span class="partner">TRDC = cNFT <span class="tooltip">**TRDC (Token Representing Credit Rights)**The on-chain credit instrument.<span class="why">Why: minted as a compressed NFT carrying the custody hash; sub-cent mint cost at scale.</span><span class="status">Build now · core artifact</span></span> </span> <span class="partner">Bubblegum <span class="tooltip">**Metaplex Bubblegum**Compressed NFT standard on Solana.<span class="why">Why: economically impossible at scale before 2025; makes per-loan tokens viable.</span><span class="status">Live tech · v1</span></span> </span> <span class="partner">Anchor gate <span class="tooltip">**Vaulx Anchor program**The custody-gate invariant: `require!(custody_confirmed ∧ terms_accepted)`<span class="why">Why: the moat. Solana runtime cannot bypass this constraint. 18–24 month replication gap.</span><span class="status">Build now · the moat</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY · THE AHA

</div>

<div class="why-text">

Two-condition release enforced on-chain.

</div>

</div>

</div>

</div>

<div class="step-box c-yellow">

<div class="step-header">

5 · MANAGE

</div>

<div class="step-body">

<span class="partner">Privy (Pix) <span class="tooltip">**Privy**Embedded wallets + fiat on/off-ramps incl. Pix. Stripe-acquired 2025.<span class="why">Why: 1-click USDC → Pix → BR bank account. Without this, USDC is stuck for the average user.</span><span class="status">Target integration · v1</span></span> </span> <span class="partner">Quartz <span class="tooltip">**Quartz**Solana off-ramp.<span class="why">Why: redundant off-ramp option, never bet on one.</span><span class="status">Target · alt route</span></span> </span> <span class="partner">Solflare Card <span class="tooltip">**Solflare Card**Mastercard-network card spending Solana wallet balance.<span class="why">Why: spend USDC at any retailer, no off-ramp needed.</span><span class="status">Live · post-hackathon</span></span> </span> <span class="partner">lobster.cash <span class="tooltip">**lobster.cash**Crossmint × Visa × Circle stablecoin card.<span class="why">Why: "borrow against your watch, pay your dinner" — the demo flourish.</span><span class="status">Live · post-hackathon</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

Pix off-ramp + card spend — like normal money.

</div>

</div>

</div>

</div>

<div class="step-box c-darkgrey">

<div class="step-header">

6 · REPAY / DEFAULT

</div>

<div class="step-body">

<span class="partner">Auction PDA <span class="tooltip">**Auction PDA**On-chain auction account for defaulted TRDC.<span class="why">Why: in-program default flow, no third party, transparent execution.</span><span class="status">Build now · v1</span></span> </span> <span class="partner">3-tier waterfall <span class="tooltip">**Privileged auction waterfall**Tier 1: platform lenders (72h first-look). Tier 2: reseller partners (Felipe's network). Tier 3: public auction.<span class="why">Why: target 90% recovery at 50% LTV — the math that makes the book work.</span><span class="status">Build now · core mechanism</span></span> </span> <span class="partner">Extrajudicial <span class="tooltip">**Extrajudicial recovery**DL 911/69 + Lei 14.711/2023 + CNJ Provision 196/2025.<span class="why">Why: BR law allows recovery without court — game-changer for default economics.</span><span class="status">BR Phase 0 · jurisdiction-pluggable</span></span> </span> <span class="partner">recovery (BR law) <span class="tooltip">**BR legal stack**Lei 14.905/2024 eliminated usury cap for FI lending.<span class="why">Why: makes 26% APR borrower rate legal and stable.</span><span class="status">In effect</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

90% recovery target at 50% LTV.

</div>

</div>

</div>

</div>

</div>

<div class="flow-arrow">

</div>

<div class="spine">

<div class="spine-label">

VAULX CORE · 1 AUDITED ANCHOR PROGRAM · 4 VAULTS

</div>

<div class="spine-code">

require!(custody_confirmed ∧ terms_accepted)

</div>

<div class="spine-caption">

— the invariant the Solana runtime cannot bypass · 18–24 month replication moat

</div>

<div class="spine-vaults">

Inst-USDC·Inst-BRL·Retail-FIDC-USDC·Retail-FIDC-BRL

</div>

</div>

<div class="lane-label">

SUPPLY ▶ LIQUIDITY PROVIDER JOURNEY <span class="legend">hover any partner for detail</span>

</div>

<div class="swimlane">

<div class="step-box c-blue">

<div class="step-header">

1 · ONBOARD

</div>

<div class="step-body">

<span class="partner">Civic accredited <span class="tooltip">**Civic Pass · Accredited tier**Institutional-grade KYC/KYB for lender onboarding.<span class="why">Why: institutional capital cannot deposit without verified compliance.</span><span class="status">Target integration</span></span> </span> <span class="partner">Tokeny / 3643 <span class="tooltip">**Tokeny / ERC-3643 (T-REX)**Standard for tokenized regulated securities.<span class="why">Why: wraps Vaulx LP tokens as compliant securities for institutional investors.</span><span class="status">Phase 2 · institutional path</span></span> </span> <span class="partner">FIDC wrapper <span class="tooltip">**FIDC wrapper**Brazilian retail securitization vehicle (Fundo de Investimento em Direitos Creditórios).<span class="why">Why: funds the Retail-FIDC-USDC + Retail-FIDC-BRL vaults from BR retail capital.</span><span class="status">Phase 1 · BR-specific</span></span> </span> <span class="partner">B2B onboarding <span class="tooltip">**B2B onboarding flow**Direct institutional desk for whale lenders.<span class="why">Why: high-touch onboarding is faster than self-serve for \$1M+ tickets.</span><span class="status">Phase 1 · George + Felipe</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

Compliant rails for institutional + retail.

</div>

</div>

</div>

</div>

<div class="step-box c-green">

<div class="step-header">

2 · ALLOCATE

</div>

<div class="step-body">

<span class="partner">Inst-USDC <span class="tooltip">**Institutional-USDC vault**USD-denominated lending pool for institutional depositors.<span class="why">Why: dollar exposure, blue-chip lenders, ~11% APY.</span><span class="status">v1 vault</span></span> </span> <span class="partner">Inst-BRL <span class="tooltip">**Institutional-BRL vault**BRL-denominated lending pool (BRZ stablecoin).<span class="why">Why: BR institutional lenders avoid FX exposure, ~14% APY.</span><span class="status">v1 vault</span></span> </span> <span class="partner">Retail-FIDC-USDC <span class="tooltip">**Retail-FIDC-USDC vault**USD vault wrapped by FIDC for BR retail investors.<span class="why">Why: BR-compliant retail access to USD yield from luxury collateral.</span><span class="status">Phase 1 vault</span></span> </span> <span class="partner">Retail-FIDC-BRL <span class="tooltip">**Retail-FIDC-BRL vault**BRL vault wrapped by FIDC for BR retail investors.<span class="why">Why: native-currency retail product, broadest BR addressable market.</span><span class="status">Phase 1 vault</span></span> </span> <span class="partner">Pick risk profile <span class="tooltip">**Vault selection UX**Lender chooses vault based on currency + risk preference.<span class="why">Why: same Anchor code, four PDA seeds = one audit covers all.</span><span class="status">v1 dashboard</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

4 vaults · 1 audited program · same code.

</div>

</div>

</div>

</div>

<div class="step-box c-grey">

<div class="step-header">

3 · DEPOSIT

</div>

<div class="step-body">

<span class="partner">Kamino OCC <span class="tooltip">**Kamino Off-Chain Collateral**Q1 2026 launch with Chainlink + Anchorage Digital. Institutional lenders deposit into Kamino → routed to off-chain RWA originators.<span class="why">Why: Vaulx becomes a borrower-side originator on Kamino's rails — instant institutional liquidity.</span><span class="status">Target integration · race window open</span></span> </span> <span class="partner">Plume Nest <span class="tooltip">**Plume Nest on Solana**Live with WisdomTree, Hamilton Lane, Securitize, SuperState. Partners with Squads Lab.<span class="why">Why: TradFi capital tokenized via Plume → flows into Vaulx vaults. Plugs into Loopscale + Jupiter for distribution.</span><span class="status">Target integration · v1</span></span> </span> <span class="partner">SCD balance sheet <span class="tooltip">**SCD balance sheet**BACEN-licensed SCD partner originates loans from own book at Phase 0.<span class="why">Why: bridge capital before institutional/FIDC flows scale.</span><span class="status">Phase 0 · pre-arranged</span></span> </span> <span class="partner">Direct USDC <span class="tooltip">**Direct USDC deposits**Native crypto whales deposit directly into Inst-USDC vault.<span class="why">Why: zero-friction path for crypto-native LPs.</span><span class="status">v1</span></span> </span> <span class="partner">Direct BRZ <span class="tooltip">**Direct BRZ deposits**Native deposits into Inst-BRL vault.<span class="why">Why: BR crypto LPs avoid FX, get local-currency yield.</span><span class="status">v1</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

Solana institutional liquidity rails.

</div>

</div>

</div>

</div>

<div class="step-box c-orange">

<div class="step-header">

4 · EARN

</div>

<div class="step-body">

<span class="partner">11% APY USDC <span class="tooltip">**11% APY USDC blended**Lender yield from blended book.<span class="why">Why: competitive with Maple/Centrifuge at superior collateral profile (physical luxury vs. invoices/RE).</span><span class="status">Phase 1 target</span></span> </span> <span class="partner">~14% APY BRL <span class="tooltip">**~14% APY BRL blended**Higher rate matches BR funding cost (Selic ~10%).<span class="why">Why: makes BRL vaults attractive to BR fixed-income desks.</span><span class="status">Phase 1 target</span></span> </span> <span class="partner">LTV live oracle <span class="tooltip">**Live LTV monitoring**Oracle reads Chrono24/WatchCharts → on-chain LTV per loan, updated continuously.<span class="why">Why: lenders see live collateral coverage; auto-alerts on liquidation risk.</span><span class="status">Build now · v1</span></span> </span> <span class="partner">Risk transparency <span class="tooltip">**Risk transparency**Each TRDC links to: asset photo, IoT vault feed, custody hash, LTV history, loan terms.<span class="why">Why: best-in-class lender visibility = lower risk premium = higher yield to borrowers, higher net to lenders.</span><span class="status">v1 dashboard</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

Yield with on-chain collateral visibility.

</div>

</div>

</div>

</div>

<div class="step-box c-red">

<div class="step-header">

5 · RECOVERIES

</div>

<div class="step-body">

<span class="partner">Privileged 72h <span class="tooltip">**72h privileged window**On default, platform lenders get exclusive bid window before public auction.<span class="why">Why: lenders recover collateral at favorable price, not market panic price.</span><span class="status">v1 mechanism</span></span> </span> <span class="partner">Platform first-look <span class="tooltip">**Platform-first auction**Vault depositors get first crack at defaulted assets matched to their vault tier.<span class="why">Why: aligns lender economics with platform; differentiates from open-market liquidations.</span><span class="status">v1</span></span> </span> <span class="partner">Reseller curation <span class="tooltip">**Tier 2: Reseller curation**Felipe's SP watch-reseller network gets Tier 2 access.<span class="why">Why: trade-network buyers absorb collateral at retail-adjacent price, lifting recovery.</span><span class="status">Felipe's edge</span></span> </span> <span class="partner">Public auction <span class="tooltip">**Tier 3: Public auction**Open Solana + off-chain auction if Tiers 1-2 don't clear.<span class="why">Why: backstop for liquidity; protects book worst-case.</span><span class="status">v1</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

Lenders get first crack on defaulted assets.

</div>

</div>

</div>

</div>

<div class="step-box c-grey">

<div class="step-header">

6 · DISTRIBUTE

</div>

<div class="step-body">

<span class="partner">Loopscale <span class="tooltip">**Loopscale**Solana lending aggregator. Plume partnership live.<span class="why">Why: distribution venue for Vaulx-originated TRDC; lenders get secondary liquidity.</span><span class="status">Future · post-hackathon</span></span> </span> <span class="partner">Jupiter <span class="tooltip">**Jupiter**Solana liquidity hub.<span class="why">Why: composable secondary market for TRDC tokens — lender can exit position.</span><span class="status">Future · v2</span></span> </span> <span class="partner">TRDC secondary <span class="tooltip">**TRDC secondary market**Vaulx LP tokens tradeable as institutional fixed-income.<span class="why">Why: turns the loan book into a securitizable asset class.</span><span class="status">Phase 6 · 100+ active loans</span></span> </span> <span class="partner">Composable cNFT <span class="tooltip">**Composable cNFT TRDC**Compressed NFT standard means TRDC plugs into any Solana NFT/RWA app.<span class="why">Why: distribution multiplier — every Solana app is a potential Vaulx liquidity venue.</span><span class="status">Built-in by design</span></span> </span>

<div class="why-block">

<div class="why-label">

WHY

</div>

<div class="why-text">

Composability = lender liquidity exit.

</div>

</div>

</div>

</div>

</div>

<div class="flow-arrow">

</div>

<div class="footer">

<div>

<div class="tagline">

One audited program. Four vaults. Global jurisdiction-pluggable. São Paulo Q3 2026 → LatAm → MENA → SE Asia.

</div>

<div class="meta">

Custody-gated RWA lending on Solana · Frontier Hackathon 2026

</div>

</div>

<div class="brand">

vaulx.app

</div>

</div>

</div>
