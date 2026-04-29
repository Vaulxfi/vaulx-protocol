<a href="#main" class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0">Skip to content</a>

<div>

<div class="header-inner">

<a href="#" class="logo" aria-label="Vaulx home"><img src="data:image/svg+xml;base64,PHN2ZyBjbGFzcz0ibG9nby1tYXJrIiB2aWV3Ym94PSIwIDAgMjggMjgiIGZpbGw9Im5vbmUiIGFyaWEtaGlkZGVuPSJ0cnVlIj4KICAgICAgICA8cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiIG9wYWNpdHk9IjAuMyIgLz4KICAgICAgICA8cGF0aCBkPSJNMTQgNiBMMjAgMTQgTDE0IDIyIEw4IDE0IFoiIGZpbGw9InZhcigtLWdvbGQpIiBvcGFjaXR5PSIwLjkiIC8+CiAgICAgICAgPGNpcmNsZSBjeD0iMTQiIGN5PSIxNCIgcj0iMyIgZmlsbD0idmFyKC0tYmcpIj48L2NpcmNsZT4KICAgICAgPC9zdmc+" class="logo-mark" /> <span class="logo-text">Garanti<span>.</span>fi</span></a>

<div class="header-right">

<span class="tag-phase">Solana · RWA · CCB</span>

![](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdib3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgYXJpYS1oaWRkZW49InRydWUiPgogICAgICAgICAgPHBhdGggZD0iTTIxIDEyLjc5QTkgOSAwIDEgMSAxMS4yMSAzIDcgNyAwIDAgMCAyMSAxMi43OXoiIC8+CiAgICAgICAgPC9zdmc+)

</div>

</div>

</div>

<div class="section hero">

<div class="hero-inner">

Platform Architecture

Luxury asset lending\
*on-chain, on Solana*
=====================

Full protocol flow — 7 steps from KYC to liquidation — with every integration, its role, timing, and the liquidity strategy to bootstrap the two-sided market.

<div class="hero-meta reveal">

<span class="meta-chip">cNFT · Bubblegum</span> <span class="meta-chip">CCB / SCD (Brazil)</span> <span class="meta-chip">USDC / BRL / PIX</span> <span class="meta-chip">Anchor · Solana</span> <span class="meta-chip">Phase 1 · 2026</span>

</div>

</div>

</div>

<div id="main" class="section flow-section">

<div class="container">

## Protocol Flow

Each step, its integrations, their role, and why they are needed.

<div class="flow-grid">

<div class="step-card reveal">

<div class="step-header">

<span class="step-num">01</span>

<div class="step-title-area">

<div class="step-title">

Onboarding & KYC

</div>

<div class="step-desc">

User identity verification, wallet creation, and Brazilian regulatory gate before any loan can be opened.

</div>

</div>

</div>

<div class="step-plugins">

<div class="plugin">

<div class="plugin-icon" style="background:var(--blue-hi);color:var(--blue-soft)">

Cv

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Civic Pass</span> <span class="badge badge-now">NOW</span> <span class="badge badge-oracle">ON-CHAIN GATE</span>

</div>

<div class="plugin-why">

On-chain identity NFT — Anchor program checks civic pass before any instruction executes. KYC/AML compliance without centralised DB.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--muted-purple-hi);color:var(--muted-purple)">

Pv

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Privy</span> <span class="badge badge-now">NOW</span> <span class="badge badge-host">HOST / UX</span>

</div>

<div class="plugin-why">

Embedded wallet layer — passkey/social login, no seed phrase, hosts on-ramp widget (MoonPay, Bridge/Stripe). Auth + wallet in one SDK.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--green-hi);color:var(--green-soft)">

Lz

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">LazorKit</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Passkey / FaceID signing for mobile — eliminates browser wallet dependency on iOS/Android. Critical for Brazil's smartphone-first user base.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--gold-hi);color:var(--gold-soft)">

Cx

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Crossmint</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Custodial wallet + fiat on-ramp for users who can't manage self-custody. Credit card → USDC. Broadens addressable user base.

</div>

</div>

</div>

</div>

</div>

<div class="step-card reveal">

<div class="step-header">

<span class="step-num">02</span>

<div class="step-title-area">

<div class="step-title">

Triangular Appraisal

</div>

<div class="step-desc">

Three independent market signals anchored by a blinded appraiser oracle — watch value established before collateral is accepted.

</div>

</div>

</div>

<div class="step-plugins">

<div class="plugin">

<div class="plugin-icon" style="background:var(--surface-2);color:var(--text-muted)">

M6

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Chrono24 / WatchCharts</span> <span class="badge badge-oracle">MARKET FEED</span>

</div>

<div class="plugin-why">

Real-time secondary market data — M6 rolling average sets the price anchor for LTV calculation. Prevents stale or manipulated valuations.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--muted-purple-hi);color:var(--muted-purple)">

Or

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Blinded Appraiser Oracle</span> <span class="badge badge-oracle">ORACLE</span>

</div>

<div class="plugin-why">

Certified appraiser signs a valuation hash on-chain without seeing other appraisers' outputs. Prevents collusion. Hash stored in TRDC metadata.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--blue-hi);color:var(--blue-soft)">

Ip

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">IPFS / Arweave</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Permanent appraisal report storage — CID hashed into cNFT metadata. Makes valuation audit trail immutable and publicly verifiable.

</div>

</div>

</div>

</div>

</div>

<div class="step-card reveal">

<div class="step-header">

<span class="step-num">03</span>

<div class="step-title-area">

<div class="step-title">

CCB + TRDC Mint

</div>

<div class="step-desc">

Legal debt instrument (CCB) issued by a licensed SCD partner, compressed NFT minted on Bubblegum to represent the TRDC tokenised receivable.

</div>

</div>

</div>

<div class="step-plugins">

<div class="plugin">

<div class="plugin-icon" style="background:var(--red-hi);color:var(--red-soft)">

SC

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">SCD Licensed Partner</span> <span class="badge badge-legal">LEGAL</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Sociedade de Crédito Direto — regulated Brazilian fintech licensed to originate CCBs. Required by BCB Res. 4656/2018. Without SCD, no legal CCB, no protocol.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--green-hi);color:var(--green-soft)">

Bg

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Metaplex Bubblegum cNFT</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Compressed NFT via state compression — 2,400× cheaper than regular NFTs. Each TRDC costs ~\$0.0004 to mint. Economically viable at any loan size.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--amber-hi);color:var(--amber)">

Tk

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Tokeny / ERC-3643 concept</span> <span class="badge badge-later">LATER</span>

</div>

<div class="plugin-why">

Transfer restriction layer for secondary TRDC market — investor whitelisting, compliance checks on P2P trades. Needed for EVM bridge if institutional secondary market opens.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--red-hi);color:var(--red-soft)">

ICP

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">ICP-Brasil e-Signature</span> <span class="badge badge-legal">LEGAL</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Brazilian legally-binding digital signature on CCB PDF — required for extrajudicial enforceability under CNJ Provimento 196/2025.

</div>

</div>

</div>

</div>

</div>

<div class="step-card reveal">

<div class="step-header">

<span class="step-num">04</span>

<div class="step-title-area">

<div class="step-title">

Custody Gate & Disbursement

</div>

<div class="step-desc">

Physical asset lodged with a licensed custodian. On-chain gate blocks disbursement until custody is cryptographically confirmed. Multisig required.

</div>

</div>

</div>

<div class="step-plugins">

<div class="plugin">

<div class="plugin-icon" style="background:var(--gold-hi);color:var(--gold-soft)">

Br

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Brinks Brasil</span> <span class="badge badge-alt">ALT A</span>

</div>

<div class="plugin-why">

Global custodian with Brazilian operations — co-signs `confirmCustody` instruction. Active talks — brings international credibility.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--gold-hi);color:var(--gold-soft)">

Ps

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Proseguro</span> <span class="badge badge-alt">ALT B</span>

</div>

<div class="plugin-why">

Brazil-native high-value asset custodian — strong local network of certified vaults, faster integration, lower cost per custody event.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--gold-hi);color:var(--gold-soft)">

Lm

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Loomis</span> <span class="badge badge-alt">ALT C</span>

</div>

<div class="plugin-why">

Global logistics + vault — strong for cross-border luxury, potential future use if protocol expands to non-Brazilian borrowers.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--muted-purple-hi);color:var(--muted-purple)">

Sq

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Squads Multisig (2/3)</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Protocol-level custody control — 2-of-3 signers (custodian + protocol DAO + borrower) required to release collateral. No single point of failure.

</div>

</div>

</div>

</div>

</div>

<div class="step-card reveal">

<div class="step-header">

<span class="step-num">05</span>

<div class="step-title-area">

<div class="step-title">

Lender Vault & Yield

</div>

<div class="step-desc">

USDC lending pool with idle float earning yield. Four-vault architecture (active, buffer, yield, emergency reserve).

</div>

</div>

</div>

<div class="step-plugins">

<div class="plugin">

<div class="plugin-icon" style="background:var(--green-hi);color:var(--green-soft)">

Km

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Kamino Finance</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Isolated lending market on Solana (\$2.45B TVL) — idle USDC float earns yield in Kamino strategy vaults. Kamino provides market rails; you attract the lenders via curators (Re7, MEV Capital).

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--green-hi);color:var(--green-soft)">

Ls

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Loopscale</span> <span class="badge badge-now">NOW · PRIMARY</span>

</div>

<div class="plugin-why">

Order-book credit market — best fit for novel RWA collateral. No governance vote needed to open a market. First BRL credit market on Solana (Transfero + Etherfuse, March 2026). Bilateral lender matching = single anchor lender can seed \$5-10M.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--amber-hi);color:var(--amber)">

Pl

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Plume Network</span> <span class="badge badge-later">LATER — PHASE 2</span>

</div>

<div class="plugin-why">

RWA-native L2 for institutional lender distribution — Apollo (\$50M), Solv (\$10M), Hamilton Lane funds on Plume Nest. Connects TRDCs to cross-chain institutional capital once protocol has track record. Not a liquidity source for launch.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--red-hi);color:var(--red-soft)">

FD

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">FIDC / CVM Res. 175</span> <span class="badge badge-legal">LEGAL</span> <span class="badge badge-later">LATER</span>

</div>

<div class="plugin-why">

Brazilian receivables fund wrapper — required to attract Brazilian institutional capital (pension funds, family offices) at scale. Requires CVM registration. Phase 2 regulatory milestone.

</div>

</div>

</div>

</div>

</div>

<div class="step-card reveal">

<div class="step-header">

<span class="step-num">06</span>

<div class="step-title-area">

<div class="step-title">

Repayment & Renewal

</div>

<div class="step-desc">

Borrower repays in USDC or BRL/PIX. CCB can be renewed at zero variable cost (no remint). Cron monitors overdue status.

</div>

</div>

</div>

<div class="step-plugins">

<div class="plugin">

<div class="plugin-icon" style="background:var(--blue-hi);color:var(--blue-soft)">

Pv

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Privy</span> <span class="badge badge-host">HOST</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Hosts the off-ramp widget UI inside the app. Does not handle fiat settlement itself — surfaces the ramp provider's interface inside a seamless UX shell.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--green-hi);color:var(--green-soft)">

Qz

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Quartz Off-ramp</span> <span class="badge badge-rail">RAIL</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

Actual USDC → BRL/PIX settlement rail — Solana-native, direct PIX integration. The money moves here. Runs inside Privy's hosted widget.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--surface-2);color:var(--text-muted)">

Rp

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Ramp Network</span> <span class="badge badge-alt">ALT RAIL</span>

</div>

<div class="plugin-why">

PIX-capable off-ramp, pluggable into Privy as custom provider. Backup if Quartz capacity is limited at scale. Broader geography coverage for future non-BR users.

</div>

</div>

</div>

</div>

</div>

<div class="step-card full-width reveal">

<div class="step-header">

<span class="step-num">07</span>

<div class="step-title-area">

<div class="step-title">

Default & Liquidation

</div>

<div class="step-desc">

SCD extrajudicial recovery (CNJ Prov. 196/2025 — privileged 7-day creditor right). Auction flywheel. cNFT full ownership transfer to liquidator. 5% protocol fee.

</div>

</div>

</div>

<div class="step-plugins">

<div class="plugin">

<div class="plugin-icon" style="background:var(--red-hi);color:var(--red-soft)">

SC

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">SCD Extrajudicial Recovery</span> <span class="badge badge-legal">LEGAL</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

CNJ Provimento 196/2025 — Brazilian SCD partners hold privileged 7-day right to seize collateral before general creditors. Eliminates 2-4 year court process. Core protocol security property.

</div>

</div>

</div>

<div class="plugin">

<div class="plugin-icon" style="background:var(--amber-hi);color:var(--amber)">

Au

</div>

<div class="plugin-body">

<div class="plugin-name-row">

<span class="plugin-name">Auction Flywheel</span> <span class="badge badge-now">NOW</span>

</div>

<div class="plugin-why">

On-chain Dutch auction — collateral listed at appraised value, decrements 1% per 6h until sold. cNFT transfers to winning bidder atomically. Ensures market-rate liquidation without broker dependency.

</div>

</div>

</div>

</div>

</div>

</div>

</div>

</div>

<div id="liquidity" class="section liquidity-section">

<div class="container">

## Liquidity Strategy

Neither Kamino nor Plume brings you lenders. They provide infrastructure. You close 2–3 anchor relationships manually to seed the first \$5–10M.

<div class="liq-callout reveal">

<div class="liq-callout-title">

The core distinction

</div>

Kamino's \$2.45B TVL belongs to Kamino's existing lenders — they flow into a Vaulx market only if yield is competitive and the cNFT collateral has a verified oracle and liquidation path they trust. Loopscale requires only an oracle and initial liquidity to open a market — **no governance vote**. A single family office or crypto credit fund can seed the first market bilaterally.

</div>

<div class="liq-table-wrap reveal">

| Phase | Partner | What They Provide | What You Provide |
|----|----|----|----|
| <span class="badge badge-now">LAUNCH</span> | Loopscale | Order-book venue, BRL/USDC market rails, no governance friction, bilateral lender matching | Appraiser oracle, cNFT spec, anchor lender introduction |
| <span class="badge badge-now">LAUNCH</span> | Vault Curator (Re7 / MEV Capital) | Managed USDC pool allocated to Vaulx market on Kamino | Competitive yield vs Maple/OnRe, curator partnership deal |
| <span class="badge badge-now">LAUNCH</span> | Mercado Bitcoin / Transfero | BRL-denominated institutional lender base, PIX rails, regulatory credibility in Brazil | Revenue share, co-marketing, regulatory facilitation |
| <span class="badge badge-later">6 MONTHS</span> | Kamino V2 RWA Market | Scale venue with \$2.45B TVL base, curator ecosystem, isolated market architecture | Zero-bad-debt track record, curator relationship already established |
| <span class="badge badge-later">PHASE 2</span> | Plume Nest | Institutional investor distribution (Apollo, Solv, Hamilton Lane) across chains | Protocol metrics, Plume partnership deal, FIDC wrapper complete |

</div>

</div>

</div>

<div class="section insight-section">

<div class="container">

## Critical Decisions

The three things that will make or break the launch liquidity equation.

<div class="insight-grid">

<div class="insight-card reveal">

<div class="insight-card-label">

Priority \#1

</div>

<div class="insight-card-title">

Close the SCD partner first

</div>

Without a BCB-licensed SCD co-signer, no CCB can be issued. No CCB = no protocol. This is the single blocking dependency. Everything else is infrastructure.

</div>

<div class="insight-card reveal">

<div class="insight-card-label">

Priority \#2

</div>

<div class="insight-card-title">

Loopscale over Kamino at launch

</div>

Loopscale's bilateral order book means one anchor lender (Mercado Bitcoin treasury, a family office, Credora) can seed the market without a governance vote or minimum TVL threshold. Kamino is a scale venue — use it at month 6 once track record exists.

</div>

<div class="insight-card reveal">

<div class="insight-card-label">

Priority \#3

</div>

<div class="insight-card-title">

Privy hosts, Quartz moves money

</div>

Privy is the UX container for on/off-ramp widgets. Quartz (and Ramp Network as backup) is the actual USDC→BRL/PIX settlement pipe. They are complementary — both required, not competing.

</div>

</div>

</div>

</div>

<div class="footer-inner">

<div class="footer-note">

Vaulx · Solana Hackathon Architecture Brief · April 2026

</div>

<div class="footer-note">

Solana · Anchor · Metaplex Bubblegum · BCB Res. 4656/2018 · CNJ Prov. 196/2025

</div>

</div>
