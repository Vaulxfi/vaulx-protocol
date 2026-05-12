<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnchainEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Receives the bridge's `signAndPost` webhooks (one POST per Anchor
 * `#[event]` emission, fired from `apps/bridge/src/webhook/listener.ts`).
 *
 * Auth contract — symmetric to the bridge's outbound HMAC:
 *   Canonical payload (UTF-8): `${timestamp}\nPOST\n${path}\n${body}`
 *   Headers:
 *     X-Vaulx-Timestamp  — Unix seconds the bridge minted
 *     X-Vaulx-Signature  — hex-lowercase HMAC-SHA256 over canonical
 *   Secret: `config('solana_bridge.shared_secret')` (same `BRIDGE_SHARED_SECRET`
 *           that the bridge's HMAC middleware accepts).
 *   Freshness: same window the bridge uses (default 300s); rejects replays.
 *
 * Persistence:
 *   - Inserts into the existing `onchain_events` table (signature column has
 *     a UNIQUE index, so duplicate events for the same tx don't double-write).
 *   - On unique-constraint conflict we no-op and return 200 — the bridge can't
 *     tell apart "Laravel rejected" vs "Laravel never saw" and would warn the
 *     same way; making duplicates idempotent keeps logs clean.
 *
 * Errors:
 *   401 missing_auth_headers / invalid_timestamp / stale_timestamp / bad_signature
 *   400 invalid_event_name / invalid_payload
 *   500 persist_failed (logged; the bridge swallows non-2xx so this is
 *       observability-only, no client-facing impact)
 */
class BridgeWebhookController extends Controller
{
    /** Tolerate the same clock-skew window the bridge uses (5min default). */
    private const FRESHNESS_SECONDS = 300;

    public function store(Request $request, string $event): JsonResponse
    {
        $secret = (string) config('solana_bridge.shared_secret', '');
        if ($secret === '') {
            // No shared secret = no auth = refuse silently. This shouldn't
            // happen in deployed envs, but stops the receiver from accepting
            // anonymous POSTs in dev when the dev forgot to set the env.
            return response()->json(['ok' => false, 'error' => 'bridge_not_configured'], 503);
        }

        // 1. HMAC verify
        $tsHeader = $request->header('X-Vaulx-Timestamp');
        $sigHeader = $request->header('X-Vaulx-Signature');
        if (!is_string($tsHeader) || !is_string($sigHeader) || $tsHeader === '' || $sigHeader === '') {
            return response()->json(['ok' => false, 'error' => 'missing_auth_headers'], 401);
        }
        $ts = filter_var($tsHeader, FILTER_VALIDATE_INT);
        if ($ts === false) {
            return response()->json(['ok' => false, 'error' => 'invalid_timestamp'], 401);
        }
        if (abs(time() - $ts) > self::FRESHNESS_SECONDS) {
            return response()->json(['ok' => false, 'error' => 'stale_timestamp'], 401);
        }

        $rawBody = (string) $request->getContent();
        // Canonical path mirrors the bridge: pathname only, no host, no query.
        // `originalUrl()` includes the query; for these webhooks the path is
        // always `/api/onchain-events/{event}` and there's no query — but we
        // strip defensively so a future query string doesn't break the HMAC.
        $signedPath = '/' . ltrim(parse_url($request->fullUrl(), PHP_URL_PATH) ?: $request->path(), '/');
        $expected = hash_hmac('sha256', "{$ts}\nPOST\n{$signedPath}\n{$rawBody}", $secret);
        $providedNorm = strtolower(trim($sigHeader));
        if (!hash_equals($expected, $providedNorm)) {
            return response()->json(['ok' => false, 'error' => 'bad_signature'], 401);
        }

        // 2. Validate event name (kebab-case slug — bridge produces these via
        //    camelToKebab; reject anything else so we never write garbage).
        if (!preg_match('/^[a-z][a-z0-9-]{0,63}$/', $event)) {
            return response()->json(['ok' => false, 'error' => 'invalid_event_name'], 400);
        }

        // 3. Parse + validate payload shape
        $payload = json_decode($rawBody, true);
        if (!is_array($payload)) {
            return response()->json(['ok' => false, 'error' => 'invalid_payload'], 400);
        }

        $signature = is_string($payload['signature'] ?? null) ? $payload['signature'] : null;
        $slot = is_int($payload['slot'] ?? null) ? $payload['slot'] : null;
        $programId = isset($payload['program']) && is_string($payload['program'])
            ? $payload['program']
            : null;

        // 4. Persist (idempotent on (signature, event_name) — a single tx
        //    routinely fires multiple events from different programs, e.g.
        //    create_ccb_trdc emits both CcbTrdcCreated (loan) AND
        //    TrdcStateInitialized (trdc) under the same signature. The
        //    composite unique index lets each event be its own row while
        //    still blocking webhook-retry duplicates of the same (sig, evt).
        try {
            OnchainEvent::firstOrCreate(
                $signature !== null
                    ? ['signature' => $signature, 'event_name' => $event]
                    : [],
                [
                    'event_name' => $event,
                    'signature' => $signature,
                    'slot' => $slot,
                    'program_id' => $programId,
                    'payload' => $payload,
                    'occurred_at' => now(),
                ],
            );
        } catch (\Throwable $e) {
            Log::warning('BridgeWebhook persist failed', [
                'event' => $event,
                'signature' => $signature,
                'message' => $e->getMessage(),
            ]);
            return response()->json(['ok' => false, 'error' => 'persist_failed'], 500);
        }

        return response()->json(['ok' => true]);
    }
}
