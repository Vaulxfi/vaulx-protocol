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

## P2 — close post-submission for first integrations

- Kamino Off-Chain Collateral institutional onboarding
- Plume Nest institutional issuance
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
