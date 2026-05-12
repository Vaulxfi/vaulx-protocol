<?php

use App\Http\Controllers\Api\BridgeWebhookController;
use App\Http\Controllers\Api\EventsController;
use App\Http\Controllers\Api\RatesController;
use App\Http\Controllers\Api\VaultsController;
use App\Http\Controllers\DemoSessionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public price + onchain snapshot endpoints (used by frontend)
Route::prefix('rates')->group(function () {
    Route::get('/', [RatesController::class, 'index']);
    Route::get('/brz-monitor', [RatesController::class, 'brzMonitor']);
});

Route::get('/vaults', [VaultsController::class, 'index']);

Route::prefix('onchain')->group(function () {
    Route::get('/events', [EventsController::class, 'index']);
    Route::get('/cron-runs', [EventsController::class, 'cronRuns']);
});

// Inbound webhooks from the Solana bridge (signAndPost in apps/bridge/
// src/webhook/listener.ts). HMAC verification is inline in the controller
// — we keep these out of `auth:sanctum` because the bridge isn't a session-
// based caller. See BridgeWebhookController docblock for the auth contract.
Route::post('/onchain-events/{event}', [BridgeWebhookController::class, 'store']);

// Demo state reset (token-gated, partner-facing). Companion to GET /demo
// in routes/web.php. Header `X-Demo-Token` must equal DEMO_MAGIC_TOKEN.
Route::post('/demo/reset', [DemoSessionController::class, 'reset']);

