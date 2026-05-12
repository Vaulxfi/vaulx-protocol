<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Solana Bridge — HMAC-signed HTTP client config
    |--------------------------------------------------------------------------
    |
    | Consumed by `App\Services\SolanaBridge`. The bridge service runs in
    | `vaulx-protocol/apps/bridge/` and exposes the 4 Vaulx Anchor programs
    | (loan / vault / trdc / auction) as REST endpoints behind a shared HMAC
    | gate. See the merge spec §3 Area B for the integration shape.
    |
    | `shared_secret` MUST match the `BRIDGE_SHARED_SECRET` set on the bridge
    | side — that's the symmetric key both ends use to sign + verify
    | requests. Generate with `openssl rand -hex 32`.
    |
    */

    'base_url' => env('SOLANA_BRIDGE_BASE_URL', 'http://127.0.0.1:8787'),

    'shared_secret' => env('SOLANA_BRIDGE_SHARED_SECRET'),

    'timeout_seconds' => (int) env('SOLANA_BRIDGE_TIMEOUT_SECONDS', 30),

    /*
    |--------------------------------------------------------------------------
    | Demo asset mint
    |--------------------------------------------------------------------------
    |
    | Pubkey (base58) of the asset mint the admin dashboard reads vault state
    | from. Falls back to `GF_USDC_MINT` so prod only needs ONE env var
    | (`GF_USDC_MINT`) to keep wallet/UI mint and bridge mint in sync —
    | the previous setup with two independent vars caused a silent drift
    | where the wallet UI read mint A while bridge txs moved mint B,
    | and balances rendered as zero on the connected wallet.
    | Override `SOLANA_BRIDGE_DEMO_ASSET_MINT` only when intentionally
    | targeting a different mint than the one users see in their wallet.
    |
    */
    'demo_asset_mint' => env(
        'SOLANA_BRIDGE_DEMO_ASSET_MINT',
        env('GF_USDC_MINT', '3eXFpUHRtg7UdJviTtz9LP87LfGk2aYsPDfkjDFai672'),
    ),
];
