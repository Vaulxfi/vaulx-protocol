<?php

declare(strict_types=1);

namespace App\Services\MarketSources;

/**
 * Deterministic market-price source for dev/test.
 *
 * Same Ref.Number → same median/min/max/count, so snapshots are
 * reproducible across environments without external API calls.
 */
class StubMarketSource
{
    public function fetch(string $referenceNumber): array
    {
        $seed = crc32(strtolower(trim($referenceNumber)));

        // Deterministic pseudo-random using seed
        $median = 3000 + (($seed % 22000)) / 1.0;          // $3k–$25k
        $spread = 0.12 + ((($seed >> 8) % 25)) / 100.0;    // 12–36%
        $min = round($median * (1 - $spread), 2);
        $max = round($median * (1 + $spread), 2);
        $count = (int) (3 + (($seed >> 4) % 40));          // 3–42 listings
        $trendIndex = ($seed >> 12) % 3;
        $trend = ['stable', 'rising', 'falling'][$trendIndex];

        return [
            'median_usd' => round($median, 2),
            'min_usd' => $min,
            'max_usd' => $max,
            'listings_count' => $count,
            'trend' => $count < (int) config('garantifi.market.min_listings', 5) ? 'insufficient' : $trend,
            'sources' => [
                ['name' => 'stub', 'weight' => 1.0, 'count' => $count, 'median' => round($median, 2)],
            ],
        ];
    }
}
