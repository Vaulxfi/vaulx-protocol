<?php

return [

    'network' => env('GF_NETWORK', 'devnet'),

    'rpc_url' => env('GF_RPC_URL', 'https://api.devnet.solana.com'),

    'explorer_url' => env('GF_EXPLORER_URL', 'https://explorer.solana.com'),

    'tokens' => [
        'USDC' => [
            'mint' => env('GF_USDC_MINT', '3eXFpUHRtg7UdJviTtz9LP87LfGk2aYsPDfkjDFai672'),
            'decimals' => 6,
            'symbol' => 'USDC',
            'prefix' => '$',
            'name' => 'USD Coin',
        ],
        'BRZ' => [
            'mint' => env('GF_BRZ_MINT', 'BRzSkMr57a72LNcBwpY2ZBpBMwDMsXbxjwRs4uPMZLG'),
            'decimals' => 6,
            'symbol' => 'BRZ',
            'prefix' => 'R$',
            'name' => 'Brazilian Digital Token',
        ],
    ],

    'programs' => [
        'vault' => env('GF_VAULT_PROGRAM_ID', ''),
        'loan' => env('GF_LOAN_PROGRAM_ID', ''),
    ],

    'features' => [
        'anchor_ready' => env('GF_ANCHOR_READY', false),
        'real_cnft' => env('GF_REAL_CNFT', false),
        'notifications' => env('GF_NOTIFICATIONS_ENABLED', true),
        'market_api_real' => env('GF_MARKET_API_ENABLED', false),
        'evaluation_v12' => env('GF_EVALUATION_V12_ENABLED', true),
        'reloan' => env('GF_RELOAN_ENABLED', true),
        'reengagement_drip' => env('GF_REENGAGEMENT_ENABLED', true),
    ],

    'reloan' => [
        'max_appraisal_age_days' => env('GF_RELOAN_MAX_APPRAISAL_AGE_DAYS', 180),
        'reengagement_offer_days' => env('GF_RELOAN_REENGAGEMENT_DAYS', 30),
    ],

    'lending' => [
        // Maximum LTV ceiling in percent — borrower can request 0-100% of this ceiling.
        // Example: max_ltv_pct=60 + asset $10k → ceiling $6k → slider chooses 0-100% of $6k.
        // Aligned with the on-chain cap (programs/loan/src/errors.rs MAX_LTV_BPS=6_000).
        // Lower is safe; raising past 60 will be rejected by the program.
        'max_ltv_pct' => env('GF_MAX_LTV_PCT', 60),
    ],

    'scoring' => [
        'weights' => ['m1' => 30, 'm2' => 20, 'm3' => 15, 'm4' => 15, 'm5' => 10, 'm6' => 10],
        'm6_thresholds' => [
            'green' => 10,
            'yellow' => 20,
            'orange' => 30,
        ],
        'm6_scores' => [
            'green' => 100,
            'yellow' => 75,
            'orange' => 45,
            'red' => 10,
            'neutral' => 70,
        ],
        'm1_thresholds' => [
            'excellent' => 5,
            'good' => 10,
            'fair' => 20,
        ],
        'm1_scores' => [
            'excellent' => 100,
            'good' => 80,
            'fair' => 55,
            'poor' => 20,
        ],
        'convergence_bonus' => 5,
        'suspicious_alignment_threshold' => 20,
        'tiers' => [
            1 => 0,
            2 => 60,
            3 => 75,
            4 => 90,
        ],
    ],

    'market' => [
        'sources' => ['chrono24', 'watchcharts', 'watchfinder', 'bobs'],
        'cache_ttl' => env('GF_MARKET_CACHE_TTL', 3600),
        'min_listings' => 5,
        'urls' => [
            'chrono24' => env('GF_CHRONO24_URL', ''),
            'watchcharts' => env('GF_WATCHCHARTS_URL', ''),
        ],
        'keys' => [
            'chrono24' => env('GF_CHRONO24_KEY', ''),
            'watchcharts' => env('GF_WATCHCHARTS_KEY', ''),
        ],
    ],

    'interest' => [
        'annual_bps' => env('GF_ANNUAL_BPS', 2400),
        'late_fee_bps_monthly' => env('GF_LATE_FEE_BPS', 150),
        'origination_fee_bps' => env('GF_ORIGINATION_BPS', 250),
    ],

    'rates' => [
        'source' => env('GF_RATE_SOURCE', 'awesomeapi'),
        'cache_ttl' => env('GF_RATE_CACHE_TTL', 300),
        'fallback_brl_usd' => env('GF_FALLBACK_BRL_USD', 5.18),
    ],

    'jupiter' => [
        'price_url' => env('GF_JUPITER_PRICE_URL', 'https://price.jup.ag/v6/price'),
    ],

    'depeg' => [
        'alert_pct' => 1.0,
        'pause_pct' => 3.0,
        'convert_pct' => 5.0,
    ],
];
