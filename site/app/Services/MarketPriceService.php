<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Asset;
use App\Models\MarketConfig;
use App\Models\MarketSnapshot;
use App\Services\MarketSources\StubMarketSource;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MarketPriceService
{
    public function __construct(protected StubMarketSource $stub)
    {
    }

    public function snapshotForAsset(Asset $asset): ?MarketSnapshot
    {
        if (empty($asset->reference_number)) {
            return null;
        }
        $data = $this->fetch($asset->reference_number);
        $brlFactor = MarketConfig::factorFor((string) ($asset->brand ?? ''), $this->familyOf($asset));

        return MarketSnapshot::create([
            'asset_id' => $asset->id,
            'reference_number' => $asset->reference_number,
            'median_usd' => $data['median_usd'],
            'min_usd' => $data['min_usd'],
            'max_usd' => $data['max_usd'],
            'listings_count' => $data['listings_count'],
            'trend' => $data['trend'],
            'brl_factor' => $brlFactor,
            'sources' => $data['sources'] ?? null,
            'raw' => $data,
            'captured_at' => now(),
        ]);
    }

    /**
     * @return array{median_usd: float, min_usd: float, max_usd: float, listings_count: int, trend: string, sources?: array}
     */
    public function fetch(string $referenceNumber): array
    {
        $ttl = (int) config('garantifi.market.cache_ttl', 3600);
        return Cache::remember(
            "gf:market:{$referenceNumber}",
            $ttl,
            fn () => $this->resolveSource($referenceNumber)
        );
    }

    protected function resolveSource(string $referenceNumber): array
    {
        if (config('garantifi.features.market_api_real')) {
            try {
                return $this->fetchFromReal($referenceNumber);
            } catch (\Throwable $e) {
                Log::warning('MarketPriceService real-API failed, falling back to stub', [
                    'ref' => $referenceNumber,
                    'message' => $e->getMessage(),
                ]);
            }
        }
        return $this->stub->fetch($referenceNumber);
    }

    protected function fetchFromReal(string $referenceNumber): array
    {
        // Real sources (Chrono24, WatchCharts) plugged in behind this method.
        // For now, raise — the caller will log and fall back to stub.
        throw new \RuntimeException('Real market API not yet wired.');
    }

    protected function familyOf(Asset $asset): ?string
    {
        return $asset->model ?: null;
    }
}
