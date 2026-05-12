<?php

declare(strict_types=1);

/*
 * Mirrors vaulx-protocol/scripts/dev/squads-multisig.json (committed
 * multisig identity created by `pnpm setup:squads`). Sourced from that
 * file; env() overrides exist so prod can re-point without a code change
 * if we ever rotate the multisig.
 *
 * The /admin/multisig page reads this; nothing else in the request path
 * verifies on-chain Squads state — wiring that requires a bridge endpoint
 * that decodes the Squads `Multisig` account and walks pending proposals.
 * Until that lands, treat this as the canonical off-chain snapshot.
 */
return [
    'cluster' => env('VAULX_SQUADS_CLUSTER', 'devnet'),
    'multisig_pda' => env('VAULX_SQUADS_MULTISIG_PDA', '4uHLWx8dz3kpECAjGpP3CsB2sv9vjvFz2utVJMwfyXCj'),
    'vault_pda' => env('VAULX_SQUADS_VAULT_PDA', '99o9WXdP3Gt1wwnYtEXheTh5x599f6SfmAdn9um3hejR'),
    'threshold' => (int) env('VAULX_SQUADS_THRESHOLD', 2),
    'created_at' => env('VAULX_SQUADS_CREATED_AT', '2026-04-28T07:09:01.274Z'),
    'creation_tx' => env('VAULX_SQUADS_CREATION_TX', '3Va385yWzsUrxXY8KaQiBc1XCSkAqVxX1fzQA8nEYTur1uYgnhqix8Vt6NXq7nW1vLhqBtCeyQPP9z7b9PrejSM1'),
    'members' => [
        [
            'label' => 'Operator (payer)',
            'role' => 'CTO / deploy keypair',
            'pubkey' => '2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH',
            'wallet_type' => 'Hot wallet — Anchor deploy keypair',
            'icon' => 'bi-cpu',
        ],
        [
            'label' => 'Ops Signer',
            'role' => 'Co-founder',
            'pubkey' => '7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE',
            'wallet_type' => 'Hot wallet — devnet hardware-backed',
            'icon' => 'bi-key-fill',
        ],
        [
            'label' => 'Team Signer',
            'role' => 'Backup',
            'pubkey' => '9MBdm6fbFTMCzvesKDDBYD58JdTsqWNGiefjdaS83LzS',
            'wallet_type' => 'Hot wallet — devnet hardware-backed',
            'icon' => 'bi-shield-lock',
        ],
    ],
];
