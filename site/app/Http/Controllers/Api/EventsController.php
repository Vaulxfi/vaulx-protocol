<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CronRun;
use App\Models\OnchainEvent;
use App\Services\SolanaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventsController extends Controller
{
    public function __construct(protected SolanaService $solana)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $events = OnchainEvent::query()
            ->orderByDesc('occurred_at')
            ->limit((int) $request->get('limit', 20))
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'event_name' => $e->event_name,
                'signature' => $e->signature,
                'slot' => $e->slot,
                'payload' => $e->payload,
                'occurred_at' => optional($e->occurred_at)->toIso8601String(),
                'time' => optional($e->occurred_at)->format('H:i:s'),
                'explorer_url' => $e->signature ? $this->solana->explorerUrl('tx', $e->signature) : null,
            ]);

        $slot = $this->solana->getSlot();

        return response()->json([
            'events' => $events,
            'last_slot' => $slot,
            'as_of' => now()->toIso8601String(),
        ]);
    }

    public function cronRuns(Request $request): JsonResponse
    {
        $runs = CronRun::query()
            ->orderByDesc('ran_at')
            ->limit((int) $request->get('limit', 20))
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'scanned' => $r->scanned,
                'affected' => $r->affected,
                'status' => $r->status,
                'notes' => $r->notes,
                'ran_at' => optional($r->ran_at)->toIso8601String(),
                'time' => optional($r->ran_at)->format('H:i d/m'),
            ]);

        return response()->json([
            'runs' => $runs,
            'summary' => [
                'total_runs_today' => CronRun::whereDate('ran_at', today()->toDateString())->count(),
                'total_affected' => CronRun::sum('affected'),
                'last_run_at' => optional(CronRun::latest('ran_at')->value('ran_at'))->toIso8601String(),
            ],
        ]);
    }
}
