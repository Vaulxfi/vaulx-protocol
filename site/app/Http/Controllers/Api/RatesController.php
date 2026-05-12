<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BrzPriceReading;
use App\Services\CurrencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RatesController extends Controller
{
    public function __construct(protected CurrencyService $currency)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json($this->currency->snapshot());
    }

    public function brzMonitor(Request $request): JsonResponse
    {
        $snap = $this->currency->snapshot();
        $depeg = (float) $snap['depeg_pct'];

        [$tier, $action, $color, $paused] = $this->classifyDepeg($depeg);

        // Persist a reading so history graph has data
        try {
            BrzPriceReading::create([
                'brz_usd' => $snap['brz_usd'],
                'usd_brl' => $snap['usd_brl'],
                'brz_brl' => $snap['brz_brl'],
                'depeg_pct' => $depeg,
                'tier' => $tier,
                'read_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Ignore if table does not exist yet (migration pending)
        }

        $history = BrzPriceReading::query()
            ->orderByDesc('read_at')
            ->limit((int) $request->get('history', 24))
            ->get()
            ->map(fn ($r) => [
                'time' => $r->read_at->format('H:i'),
                'brz_usd' => (float) $r->brz_usd,
                'brz_brl' => (float) $r->brz_brl,
                'depeg_pct' => (float) $r->depeg_pct,
                'tier' => $r->tier,
            ])->values();

        return response()->json(array_merge($snap, [
            'tier' => $tier,
            'action' => $action,
            'color' => $color,
            'paused' => $paused,
            'history' => $history,
            'thresholds' => [
                'alert' => -1.0,
                'pause' => -3.0,
                'convert' => -5.0,
            ],
        ]));
    }

    protected function classifyDepeg(float $depeg): array
    {
        if ($depeg <= -5) {
            return ['convert', 'Offer BRZ → USDC conversion at adjusted rate', '#c0392b', true];
        }
        if ($depeg <= -3) {
            return ['paused', 'pause_vault BRZ triggered — BRZ loans blocked', '#e74c3c', true];
        }
        if ($depeg <= -1) {
            return ['alert', 'New BRZ loans paused preventively', '#f39c12', false];
        }
        return ['normal', 'Normal operation — within range (±1%)', '#2ecc71', false];
    }
}
