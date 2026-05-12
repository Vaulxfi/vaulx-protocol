<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurrencyService
{
    const CACHE_KEY = 'gf:rate:usd_brl';
    const BRZ_CACHE_KEY = 'gf:rate:brz_usd';

    public function usdToBrl(): float
    {
        return Cache::remember(
            self::CACHE_KEY,
            config('garantifi.rates.cache_ttl', 300),
            fn () => $this->fetchUsdBrl()
        );
    }

    public function brzUsd(): float
    {
        return Cache::remember(
            self::BRZ_CACHE_KEY,
            config('garantifi.rates.cache_ttl', 300),
            fn () => $this->fetchBrzUsd()
        );
    }

    public function brzBrl(): float
    {
        $brzUsd = $this->brzUsd();
        $usdBrl = $this->usdToBrl();
        return $usdBrl > 0 ? $brzUsd * $usdBrl : 0.0;
    }

    public function depegPercent(): float
    {
        $brzBrl = $this->brzBrl();
        if ($brzBrl <= 0) {
            return 0.0;
        }
        return round(($brzBrl - 1.0) * 100, 4);
    }

    public function convertUsdToBrl(float $usd): float
    {
        return round($usd * $this->usdToBrl(), 2);
    }

    public function convertBrlToUsd(float $brl): float
    {
        $rate = $this->usdToBrl();
        return $rate > 0 ? round($brl / $rate, 2) : 0.0;
    }

    public function snapshot(): array
    {
        return [
            'usd_brl' => $this->usdToBrl(),
            'brz_usd' => $this->brzUsd(),
            'brz_brl' => $this->brzBrl(),
            'depeg_pct' => $this->depegPercent(),
            'as_of' => now()->toIso8601String(),
            'source_usd' => 'awesomeapi',
            'source_brz' => 'jupiter',
        ];
    }

    public function forceRefresh(): void
    {
        Cache::forget(self::CACHE_KEY);
        Cache::forget(self::BRZ_CACHE_KEY);
    }

    protected function fetchUsdBrl(): float
    {
        try {
            $response = Http::timeout(5)->get('https://economia.awesomeapi.com.br/last/USD-BRL');
            if ($response->successful()) {
                $data = $response->json();
                $bid = (float) ($data['USDBRL']['bid'] ?? 0);
                if ($bid > 0) {
                    return round($bid, 4);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('CurrencyService: AwesomeAPI failed', ['message' => $e->getMessage()]);
        }

        return (float) config('garantifi.rates.fallback_brl_usd', 5.18);
    }

    protected function fetchBrzUsd(): float
    {
        try {
            $url = config('garantifi.jupiter.price_url') . '?ids=BRZ';
            $response = Http::timeout(5)->get($url);
            if ($response->successful()) {
                $data = $response->json();
                $price = (float) ($data['data']['BRZ']['price'] ?? 0);
                if ($price > 0) {
                    return round($price, 6);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('CurrencyService: Jupiter failed', ['message' => $e->getMessage()]);
        }

        $usdBrl = $this->usdToBrl();
        return $usdBrl > 0 ? round(1 / $usdBrl, 6) : 0.0;
    }
}
