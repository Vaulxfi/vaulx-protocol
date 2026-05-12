<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Tiny shared cache-on-success helper for controllers that surface
 * `SolanaBridge` reads to a view. Used by the admin dashboard (10s TTL,
 * authenticated traffic, fast-refresh demo) and the public homepage
 * (60s TTL, anonymous traffic, lower RPC pressure).
 *
 * Cache contract:
 *   - Successful reads (`ok:true`) are cached at the caller-chosen key
 *     for `ttlSeconds`.
 *   - Failed reads (`ok:false`) are passed through to the caller but
 *     NOT cached, so a transient bridge outage shows the "offline"
 *     state for one page load instead of pinning it for the full TTL.
 *   - Caller owns the cache key namespace (e.g. `chain.admin.*`,
 *     `chain.home.*`) so different audiences get independent freshness
 *     contracts even when the underlying bridge call is the same.
 */
trait FetchesCachedBridgeReads
{
    /**
     * @param  Closure(): array<string, mixed>  $fetch
     * @return array<string, mixed>
     */
    private function fetchCachedBridgeRead(
        string $key,
        int $ttlSeconds,
        Closure $fetch,
    ): array {
        $cached = Cache::get($key);
        if (is_array($cached)) {
            return $cached;
        }
        $result = $fetch();
        if (($result['ok'] ?? false) === true) {
            Cache::put($key, $result, $ttlSeconds);
        }
        return $result;
    }
}
