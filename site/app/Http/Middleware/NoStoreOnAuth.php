<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sends aggressive no-cache headers on auth-flow GET responses.
 *
 * Reason: production nginx in front of Laravel was running fastcgi_cache,
 * caching the rendered /login and /register HTML — including the per-session
 * `_token` field. Subsequent visitors received the cached HTML but a fresh
 * session cookie, so their submitted `_token` never matched their session,
 * triggering 419 ("Page Expired") on every login attempt.
 *
 * The headers below tell any well-behaved cache (CDN, reverse proxy, browser)
 * to never store this response. nginx still needs `fastcgi_no_cache` /
 * `fastcgi_cache_bypass` configured on the server side for a proper fix
 * (see deploy README), but these headers make most caches bail out.
 *
 * Applied via `auth.nocache` alias in app/Http/Kernel.php.
 */
class NoStoreOnAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, private');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');
        $response->headers->set('Vary', 'Cookie');
        // Custom signal — useful when debugging whether nginx honored our directive.
        $response->headers->set('X-Vaulx-NoStore', '1');

        return $response;
    }
}
