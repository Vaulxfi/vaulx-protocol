# Vaulx — Partnership tracker

> Internal team tracker. Not user-facing.

## P0 — must close before launch (May 10)

- BACEN-licensed SCD — LOI required
- One licensed custodian: Brinks SP / Prosegur / Loomis — MOU + CFTV/IoT rights
- Brazilian fintech counsel for CCB + fiduciary alienation

## P1 — close by submission for "named partner" deck mention

### Crossmint (primary wallet + sanctions/PEP/MiCA CASP)
- [ ] Production tier confirmed (sandbox is self-serve)
- [ ] Smart-wallet program audit report — request from Crossmint solutions team
  - Run `solana program show <PROGRAM_ID>` to inspect upgrade authority
  - If upgradeable: confirm Squads V4 multisig + timelock governance
- [ ] KYC field mapping for BR residents (CPF/RG/CNH/employment/source-of-funds)
  - Confirm gov.br ouro output covers Create User schema
- [ ] Civic Pass acceptance as Full KYC liveness gate
  - Single-flow vs duplicate-flow determines onboarding friction
- [ ] Per-region custom-token JWT bridge (gov.br for BR, Aadhaar for IN, eIDAS for EU, etc.)
- [ ] MiCA CASP umbrella for EU users (Vaulx as BR entity)

### Civic
- [ ] Full-KYC gatekeeper sub (paid; current demo uses CAPTCHA/uniqueness network)

### Kamino V2 (curator infrastructure rail / Re7 + MEV Capital onboarding lever)
- [ ] Off-Chain Collateral integration scope — share Vault + Loan IDLs with Kamino BD
- [ ] Position Kamino V2 as the curator marketplace; Re7 + MEV Capital are the actual capital relationships closed *through* this rail
- [ ] Confirm vault-creation playbook + curator KYB requirements
- [ ] Decision log: explicit framing — Kamino V2 = door-opener, not direct capital

### Re7 Labs (anchor vault curator, accessed via Kamino V2)
- [ ] Intro path via Kamino BD
- [ ] Risk-framework alignment call (LTV bands, oracle, custody attestations)
- [ ] Vault size + fee split + curator-of-record agreement
- [ ] Target: anchor vault live at launch with $2–4M committed

### MEV Capital (anchor vault curator, accessed via Kamino V2)
- [ ] Intro path via Kamino BD
- [ ] Risk-framework alignment call (LTV bands, oracle, custody attestations)
- [ ] Vault size + fee split + curator-of-record agreement
- [ ] Target: anchor vault live at launch with $2–4M committed

### Mercado Bitcoin (Brazilian institutional anchor lender)
- [ ] Term sheet for $2–5M commitment
- [ ] BR-side regulatory comfort letter (CCB + fiduciary alienation)
- [ ] Settlement rails (USDC on-chain vs BRL via SCD)

### Transfero (Brazilian institutional anchor lender)
- [ ] Term sheet for $1–3M commitment
- [ ] BR-side regulatory comfort letter (CCB + fiduciary alienation)
- [ ] Settlement rails (USDC on-chain vs BRL via SCD)

### Crypto-native credit facility — TBD specific name (anchor crypto-native credit relationship)
- [ ] Identify final counterparty (shortlist: Maple, Huma, Credible, others)
- [ ] Term sheet for $2–5M revolving credit line
- [ ] On-chain disbursement + repayment workflow agreed

## P2 — close post-submission for first integrations

- Plume Nest institutional issuance — **Phase 2 / post-launch institutional rail** (de-emphasized from launch picture)
- Apify (Chrono24 reliable scrape) — production upgrade for Chrono24 price feed reliability; keys to be requested when fallback scraping reliability becomes a constraint
- Tokeny ERC-3643 FIDC wrapper for accredited LP onboarding
- Chrono24 data licensing
- WatchCharts paid tier
- Card issuer (Marqeta / Lithic / dock.io) OR deep-link to Solflare/lobster

## P3 — eventually

- gov.br official OAuth (requires Brazilian registered entity)
- Bubblegum / Helius for cNFT loan representations

---

## Decisions log

- **2026-04-27** — Dropped Privy and LazorKit. Crossmint becomes the sole wallet/auth vendor. Civic Pass is the on-chain identity gate. Reasoning: single-vendor compliance, smart-wallet-by-default for TRDC collateral semantics, 100+ off-ramps for LATAM→MENA→SEA expansion. Privy's Stripe-acquisition value is irrelevant for Vaulx's USDC+PIX+BRL stack. LazorKit's FaceID UX is delivered natively by Crossmint's passkey signer support.
- **2026-04-27** — Re-framed liquidity-stack partnership thesis. Kamino V2 = door-opener for Re7 + MEV Capital curators (P1 capital relationships closed *through* Kamino V2's curator marketplace, not as a direct capital source). Mercado Bitcoin + Transfero + a TBD crypto-native credit facility round out the P1 anchor-lender set. Plume Nest moved to P2 (later-stage institutional rail, post-launch). Apify deferred to P2 — production upgrade for Chrono24 reliability if fallback scraping breaks down.
