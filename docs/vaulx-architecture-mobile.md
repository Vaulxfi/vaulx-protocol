<div class="mouse-spotlight" style="position:fixed;inset:0;z-index:99;pointer-events:none;">

</div>

<div class="deck">

<div class="slide slide-1 active" slide="1">

<div class="gradient-mesh">

<div class="blob" style="width:500px;height:500px;top:-120px;right:-80px;background:#9945FF;opacity:0.13;">

</div>

<div class="blob" style="width:320px;height:320px;bottom:-80px;left:-60px;background:#14F195;opacity:0.09;">

</div>

<div class="blob" style="width:220px;height:220px;top:42%;left:18%;background:#00C2FF;opacity:0.08;">

</div>

</div>

<div class="content text-center">

<div class="reveal" style="font-size:88px;margin-bottom:16px;animation:float 3.5s ease-in-out infinite;">

⌚

</div>

# Vaulx Platform Architecture

Physical RWA Collateral Lending · Solana · 2026

<div class="reveal" style="margin-top:28px;display:flex;gap:20px;justify-content:center;flex-wrap:wrap;">

<span style="font-size:0.72rem;padding:6px 14px;border-radius:20px;background:rgba(153,69,255,0.12);border:1px solid rgba(153,69,255,0.25);color:#b87fff;font-weight:600;">Anchor · Rust</span> <span style="font-size:0.72rem;padding:6px 14px;border-radius:20px;background:rgba(20,241,149,0.08);border:1px solid rgba(20,241,149,0.2);color:#14F195;font-weight:600;">Metaplex Bubblegum cNFT</span> <span style="font-size:0.72rem;padding:6px 14px;border-radius:20px;background:rgba(0,194,255,0.08);border:1px solid rgba(0,194,255,0.2);color:#00C2FF;font-weight:600;">CCB · SCD · BACEN</span>

</div>

</div>

</div>

<div class="slide slide-2" slide="2">

<div class="gradient-mesh">

<div class="blob" style="width:380px;height:380px;top:-100px;right:-60px;background:#9945FF;opacity:0.08;">

</div>

<div class="blob" style="width:260px;height:260px;bottom:-70px;left:-40px;background:#14F195;opacity:0.06;">

</div>

</div>

<div class="content">

<div class="reveal" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">

<div>

## Platform Flow & Integration Map

Solana Hackathon MVP · Anchor Programs · 7-Step Lifecycle

</div>

<div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">

<span class="tag-mvp" style="font-size:0.5rem;padding:3px 7px;border-radius:5px;">MVP</span> <span class="tag-alt" style="font-size:0.5rem;padding:3px 7px;border-radius:5px;">Alternative</span> <span class="tag-future" style="font-size:0.5rem;padding:3px 7px;border-radius:5px;">Phase 2</span> <span class="tag-core" style="font-size:0.5rem;padding:3px 7px;border-radius:5px;">Core Infra</span>

</div>

</div>

<div class="flow-grid reveal">

<div class="step-col">

<div class="step-header">

<div class="step-number">

01

</div>

<div class="step-title">

Onboarding\
& KYC

</div>

<span class="step-arrow">›</span>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-mvp">MVP</span>

</div>

<div class="plugin-name">

Privy

</div>

<div class="plugin-why">

Embedded wallet + social login. Colosseum-recommended. Passkeys native. Hosts ramp widgets via Bridge/Ramp.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-core">Core</span>

</div>

<div class="plugin-name">

Civic Pass

</div>

<div class="plugin-why">

On-chain KYC gate. Anchor `require!` constraint on vault deposits. Strongest identity layer on Solana.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-alt">Alt</span>

</div>

<div class="plugin-name">

Crossmint

</div>

<div class="plugin-why">

Fiat on-ramp alternative if Privy+Bridge insufficient for BRL entry.

</div>

</div>

</div>

<div class="step-col">

<div class="step-header">

<div class="step-number">

02

</div>

<div class="step-title">

Triangular\
Appraisal

</div>

<span class="step-arrow">›</span>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-mvp">MVP</span>

</div>

<div class="plugin-name">

RedStone Oracle

</div>

<div class="plugin-why">

RWA price feeds live on Solana via Wormhole Queries. Wraps Chrono24/WatchCharts as custom feed → market anchor value on-chain.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-core">Core</span>

</div>

<div class="plugin-name">

Chrono24 / WatchCharts

</div>

<div class="plugin-why">

M6 market anchor data source. Blinded appraiser oracle triangulation: remote + in-person + market price.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-core">Core</span>

</div>

<div class="plugin-name">

IPFS / Arweave

</div>

<div class="plugin-why">

Asset photos + appraisal hash stored off-chain. URI embedded in cNFT metadata. Immutable provenance.

</div>

</div>

</div>

<div class="step-col">

<div class="step-header">

<div class="step-number">

03

</div>

<div class="step-title">

CCB + TRDC\
Mint

</div>

<span class="step-arrow">›</span>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-core">Core</span>

</div>

<div class="plugin-name">

Metaplex Bubblegum cNFT

</div>

<div class="plugin-why">

Compressed NFT. ~2,400× cheaper than standard NFT. TRDC = on-chain credit instrument + collateral record.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-core">Core</span>

</div>

<div class="plugin-name">

SCD Partner

</div>

<div class="plugin-why">

Licensed creditor under BACEN. Signs CCB. ccbHash written to TRDC metadata. Legal instrument.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-mvp">MVP</span>

</div>

<div class="plugin-name">

Squads Multisig

</div>

<div class="plugin-why">

2/3 multisig on admin ops: pauseVault, executeAfDefault. L1/L2 authority tiers.

</div>

</div>

</div>

<div class="step-col">

<div class="step-header" style="border-color:rgba(153,69,255,0.6)!important;box-shadow:0 0 18px rgba(153,69,255,0.2);">

<div class="step-number" style="color:#9945FF!important;">

04 ★

</div>

<div class="step-title">

Custody Gate\
& Disburse

</div>

<span class="step-arrow">›</span>

</div>

<div style="background:rgba(153,69,255,0.07);border:1px solid rgba(153,69,255,0.2);border-radius:8px;padding:5px 7px;margin-bottom:2px;">

<div style="font-size:0.5rem;color:#9945FF;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:2px;">

Critical Invariant

</div>

<div style="font-size:0.52rem;color:#b87fff;font-family:'DM Sans',monospace;">

`require!(trdc.status == PENDINGCUSTODY)` — no disburse until custody confirmed

</div>

</div>

<div class="alt-list">

<div class="plugin-card">

<div>

<span class="plugin-tag tag-alt">In talks</span>

</div>

<div class="plugin-name">

Brinks

</div>

<div class="plugin-why">

confirmCustody signer. Global vaults.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-alt">In talks</span>

</div>

<div class="plugin-name">

Proseguro

</div>

<div class="plugin-why">

BR-native, BACEN-aligned. Phase 0 SP focus.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-alt">In talks</span>

</div>

<div class="plugin-name">

Loomis

</div>

<div class="plugin-why">

Luxury asset specialist. Blanket insurance rider.

</div>

</div>

</div>

</div>

<div class="step-col">

<div class="step-header">

<div class="step-number">

05

</div>

<div class="step-title">

Lender Vault\
& Yield

</div>

<span class="step-arrow">›</span>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-mvp">MVP</span>

</div>

<div class="plugin-name">

Vault Program (Anchor)

</div>

<div class="plugin-why">

4 vaults: Inst-USDC, Inst-BRL, Retail-FIDC-USDC, Retail-FIDC-BRL. Same code, different PDA seeds.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-mvp">MVP</span>

</div>

<div class="plugin-name">

Kamino Finance

</div>

<div class="plugin-why">

Idle float yield. \$1B+ RWA TVL on Solana. Capital not yet deployed to loans earns Kamino supply APY.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-future">Phase 2</span>

</div>

<div class="future" style="color:#ffaa00;">

Plume Network

</div>

<div class="plugin-why" style="color:#5a6a85;">

Cross-chain RWA liquidity via SkyLink. Routes institutional capital from Apollo/Blackstone Nest vaults into Vaulx. 16 chains.

</div>

</div>

</div>

<div class="step-col">

<div class="step-header">

<div class="step-number">

06

</div>

<div class="step-title">

Repayment\
& Renewal

</div>

<span class="step-arrow">›</span>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-mvp">MVP</span>

</div>

<div class="plugin-name">

Quartz (USDC→PIX)

</div>

<div class="plugin-why">

Solana-native USDC → BRL/PIX off-ramp. Borrower receives proceeds directly to bank account.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-alt">Alt / Wrapper</span>

</div>

<div class="plugin-name">

Privy + Ramp Network

</div>

<div class="plugin-why">

Privy hosts ramp widget. Ramp Network = PIX-native settlement rail. Redundant path if Quartz unavailable.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-core">Core</span>

</div>

<div class="plugin-name">

renewCCB mechanic

</div>

<div class="plugin-why">

Zero new appraisal. Interest-only payment extends term 120d. Highest-margin operation: +R600 contribution vs new origination.

</div>

</div>

</div>

<div class="step-col">

<div class="step-header">

<div class="step-number">

07

</div>

<div class="step-title">

Default &\
Liquidation

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-core">Core</span>

</div>

<div class="plugin-name">

SCD Extrajudicial

</div>

<div class="plugin-why">

CNJ Prov. 196/2025. Privileged 7-day auction. No court required.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-core">Core</span>

</div>

<div class="plugin-name">

cNFT Transfer

</div>

<div class="plugin-why">

Full ownership transfer to liquidation wallet. 5% liquidation fee. Auction below M3 value → surplus returned to borrower.

</div>

</div>

<div class="plugin-card">

<div>

<span class="plugin-tag tag-mvp">MVP</span>

</div>

<div class="plugin-name">

Squads executeAfDefault

</div>

<div class="plugin-why">

2/3 multisig required. Atomic: decrements TVL, marks DEFAULTED, opens auction PDA.

</div>

</div>

</div>

</div>

<div class="reveal" style="margin-top:10px;display:flex;gap:18px;align-items:center;justify-content:space-between;">

<div style="display:flex;gap:10px;align-items:center;">

<span style="font-size:0.5rem;color:#5a6a85;text-transform:uppercase;letter-spacing:0.1em;">Stack:</span> <span style="font-size:0.52rem;color:#9945FF;">Anchor/Rust</span> <span style="font-size:0.52rem;color:#5a6a85;">·</span> <span style="font-size:0.52rem;color:#14F195;">Bubblegum cNFT</span> <span style="font-size:0.52rem;color:#5a6a85;">·</span> <span style="font-size:0.52rem;color:#00C2FF;">Privy + Civic</span> <span style="font-size:0.52rem;color:#5a6a85;">·</span> <span style="font-size:0.52rem;color:#14F195;">RedStone</span> <span style="font-size:0.52rem;color:#5a6a85;">·</span> <span style="font-size:0.52rem;color:#9945FF;">Kamino</span> <span style="font-size:0.52rem;color:#5a6a85;">·</span> <span style="font-size:0.52rem;color:#FFC700;">Quartz/PIX</span>

</div>

<div style="font-size:0.5rem;color:#5a6a85;letter-spacing:0.08em;text-transform:uppercase;">

Colosseum Frontier Hackathon · May 2026

</div>

</div>

</div>

</div>

<div class="slide slide-3" slide="3">

<div class="gradient-mesh">

<div class="blob" style="width:350px;height:350px;top:-90px;left:-50px;background:#14F195;opacity:0.07;">

</div>

<div class="blob" style="width:280px;height:280px;bottom:-60px;right:-40px;background:#9945FF;opacity:0.08;">

</div>

</div>

<div class="content">

## Integration Logic — Why Each Tool

Simplified view for team alignment

<div class="reveal" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">

<div style="background:rgba(0,194,255,0.06);border:1px solid rgba(0,194,255,0.18);border-radius:12px;padding:16px;">

<div style="font-size:1.6rem;margin-bottom:8px;">

🔐

</div>

<div style="font-size:0.78rem;font-weight:700;color:#00C2FF;margin-bottom:6px;">

Identity Layer

</div>

<div style="font-size:0.62rem;color:#a8b8d8;line-height:1.5;">

**Privy** — wallet + auth, hosts ramp widget. Colosseum-listed.\
**Civic Pass** — on-chain KYC gate enforced in Anchor constraint. Non-negotiable.\
*Not both needed for auth — Privy handles UX, Civic handles enforcement.*

</div>

</div>

<div style="background:rgba(255,199,0,0.05);border:1px solid rgba(255,199,0,0.18);border-radius:12px;padding:16px;">

<div style="font-size:1.6rem;margin-bottom:8px;">

📡

</div>

<div style="font-size:0.78rem;font-weight:700;color:#FFC700;margin-bottom:6px;">

Oracle Layer

</div>

<div style="font-size:0.62rem;color:#a8b8d8;line-height:1.5;">

**RedStone** — delivers Chrono24/WatchCharts data on-chain via custom RWA feed. 1,300+ assets, live on Solana.\
*Pyth has no watch/luxury feeds — RedStone is the only viable choice for this use case.*

</div>

</div>

<div style="background:rgba(153,69,255,0.06);border:1px solid rgba(153,69,255,0.18);border-radius:12px;padding:16px;">

<div style="font-size:1.6rem;margin-bottom:8px;">

🏦

</div>

<div style="font-size:0.78rem;font-weight:700;color:#9945FF;margin-bottom:6px;">

Liquidity Layer

</div>

<div style="font-size:0.62rem;color:#a8b8d8;line-height:1.5;">

**Kamino** — idle vault capital earns yield while not deployed to loans. \$1B+ RWA TVL. Kamino pushes liquidity supply to protocol.\
**Plume (Phase 2)** — routes institutional RWA capital cross-chain (Apollo/Blackstone Nest) into Vaulx vaults via SkyLink. Not for hackathon.

</div>

</div>

<div style="background:rgba(20,241,149,0.05);border:1px solid rgba(20,241,149,0.18);border-radius:12px;padding:16px;">

<div style="font-size:1.6rem;margin-bottom:8px;">

📦

</div>

<div style="font-size:0.78rem;font-weight:700;color:#14F195;margin-bottom:6px;">

Collateral Record

</div>

<div style="font-size:0.62rem;color:#a8b8d8;line-height:1.5;">

**Metaplex Bubblegum cNFT** — TRDC token. \<\$0.001/mint vs \$5–\$50 on Ethereum. ccbHash + appraisal + custodian + status — all on-chain.\
*Non-replaceable. Core Solana infra advantage over any other chain.*

</div>

</div>

<div style="background:rgba(255,80,80,0.05);border:1px solid rgba(255,80,80,0.18);border-radius:12px;padding:16px;">

<div style="font-size:1.6rem;margin-bottom:8px;">

🚛

</div>

<div style="font-size:0.78rem;font-weight:700;color:#FF6B6B;margin-bottom:6px;">

Custody (In Talks: All 3)

</div>

<div style="font-size:0.62rem;color:#a8b8d8;line-height:1.5;">

**Brinks / Proseguro / Loomis** — physical vault partner signs confirmCustody on-chain. This is the load-bearing security property. Talks ongoing with all three — one will be Phase 0 partner.\
*Volume SLA with any one = custody cost drops 0.5%→0.3%/mo asset value.*

</div>

</div>

<div style="background:rgba(255,199,0,0.05);border:1px solid rgba(255,199,0,0.18);border-radius:12px;padding:16px;">

<div style="font-size:1.6rem;margin-bottom:8px;">

💸

</div>

<div style="font-size:0.78rem;font-weight:700;color:#FFC700;margin-bottom:6px;">

Off-Ramp / PIX

</div>

<div style="font-size:0.62rem;color:#a8b8d8;line-height:1.5;">

**Quartz** — Solana-native USDC→BRL/PIX. Primary choice.\
**Privy + Ramp Network** — Privy widget hosts Ramp Network PIX rail. Redundant path.\
*Privy does not natively do PIX — it hosts the provider. Quartz or Ramp Network does the actual BRL settlement.*

</div>

</div>

</div>

</div>

</div>

</div>

<div class="nav-controls">

‹

<div id="dots" class="slide-dots">

</div>

›

<span id="counter" class="slide-counter">1 / 3</span>

</div>
