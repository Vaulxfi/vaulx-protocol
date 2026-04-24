# Vaulx

Custody-gated RWA lending protocol on Solana. Colosseum Frontier Hackathon submission, May 2026.

See `docs/plans/` for the build plan.

## Civic Pass KYC

Vaulx enforces KYC at the protocol layer via **Civic Pass** (Solana native gateway tokens). `vault.deposit` and `loan.create_ccb_trdc` require the caller to hold an active gateway token from the configured gatekeeper network.

### Demo model — CAPTCHA / Uniqueness

The hackathon demo is configured against Civic's **CAPTCHA / uniqueness network** (`ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6`):

- Free, instant issuance via a captcha challenge.
- Proves one-wallet-per-human (Sybil resistance).
- Judges can test live in ~30 seconds via the "Verify with Civic" button in the UI.

To turn the gate on for Devnet:

```bash
pnpm init:civic --custodian <custodian-pubkey>
# then in apps/web/.env.local:
# NEXT_PUBLIC_CIVIC_PASS_NETWORK=ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6
```

### Production upgrade — full Civic Pass KYC

For regulatory-grade identity verification:

1. Open a Civic account at [civic.me](https://civic.me).
2. Subscribe to a full-KYC gatekeeper network (document upload + liveness check).
3. Pass the new network pubkey to the init helper: `pnpm init:civic --network <new-network-pubkey> --custodian <pubkey>` (note: the existing `vault_config` / `loan_config` PDAs are first-writer-wins; rotating the network on already-initialised configs requires an on-chain admin setter — currently a follow-up).
4. Rotate `NEXT_PUBLIC_CIVIC_PASS_NETWORK` in `apps/web/.env.local` to match.

No program redeploy required — the gate reads the network pubkey from on-chain config.

### Disable for development

Leave `civic_network = Pubkey::default()` in `vault_config` / `loan_config` to disable the gate entirely (this is the default). Useful for running `anchor test` without cloning the Civic program.

### Under the hood

- On-chain parser: `programs/{vault,loan}/src/civic.rs` hand-rolls a Borsh decode of the Civic gateway-token account (version, parent, owner, owner_identity, gatekeeper_network, issuing_gatekeeper, state, expiry). Gate program id: `gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs`.
- Frontend: `<CivicPassGate>` wraps children behind the `GatewayStatus.ACTIVE` check from `@civic/solana-gateway-react`. `<GatewayProvider>` in `apps/web/src/components/providers/wallet-provider.tsx` is only wired in when `NEXT_PUBLIC_CIVIC_PASS_NETWORK` is set.
- Runtime coverage: `tests/civic-happy-path.spec.ts` issues a real gateway token via `@identity.com/solana-gateway-ts` against a throwaway network and asserts the Borsh byte layout matches the on-chain parser (Active=0 → Revoked=2 flip).
