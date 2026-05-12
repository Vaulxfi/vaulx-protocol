<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * Append `Partitioned` to the session cookie when the app is configured
 * for cross-origin embeds (`SESSION_SAME_SITE=none` + Secure).
 *
 * Why we need this beyond `SameSite=None; Secure`:
 * Chrome's phase-out of third-party cookies (announced 2024) blocks the
 * legacy "send a cross-site cookie under SameSite=None" pattern even for
 * legitimate cases. The replacement is CHIPS — Cookies Having Independent
 * Partitioned State (rfc draft `draft-cutler-httpbis-partitioned-cookies`).
 * A cookie with the `Partitioned` attribute is stored keyed to the
 * top-level site of the embedder, so an iframe under partner-A's page
 * gets one isolated jar and an iframe under partner-B's page gets a
 * different one. Privacy-preserving, but the iframe session works.
 *
 * Symfony 5.x (Laravel 8) `Cookie` doesn't accept `Partitioned` in its
 * constructor. Symfony 6.4+ does, Laravel 11+ wires it through. So for
 * this app we rebuild the Set-Cookie header by string: remove the cookie
 * from the Symfony cookie collection, then add a raw `Set-Cookie` header
 * that is `(string)$cookie . '; Partitioned'`. The raw header path
 * survives `EncryptCookies::encrypt()` (which only iterates over
 * collection-stored cookies) and ends up as a clean single Set-Cookie on
 * the response.
 *
 * Placement matters: this middleware MUST be registered as the FIRST
 * entry in the `web` group so its `after()` runs LAST in the pipeline —
 * specifically after `StartSession::addCookieToResponse` (which adds the
 * session cookie) AND after `EncryptCookies::encrypt` (which encrypts
 * the cookie value). If placed later, EncryptCookies would re-replace
 * the cookie via `setCookie`, losing our raw `Partitioned` suffix.
 *
 * No-op when `session.same_site !== 'none'` — keeps the default dev/lax
 * deployment untouched and only kicks in when an operator has opted into
 * cross-origin embedding via `SESSION_SAME_SITE=none` + `SESSION_SECURE_COOKIE=true`.
 */
class PartitionSessionCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! $this->shouldPartition()) {
            return $response;
        }

        $sessionCookieName = (string) config('session.cookie');
        if ($sessionCookieName === '') {
            return $response;
        }

        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() !== $sessionCookieName) {
                continue;
            }
            $this->repartitionCookie($response, $cookie);
        }

        return $response;
    }

    private function shouldPartition(): bool
    {
        return strtolower((string) config('session.same_site')) === 'none'
            && (bool) config('session.secure');
    }

    private function repartitionCookie(Response $response, Cookie $cookie): void
    {
        // Pull the cookie out of Symfony's typed cookie jar so it isn't
        // emitted twice when Response::sendHeaders() iterates both
        // the raw Set-Cookie headers and the cookie collection.
        $response->headers->removeCookie(
            $cookie->getName(),
            $cookie->getPath(),
            $cookie->getDomain()
        );

        // (string)$cookie produces a fully-formed Set-Cookie value
        // (name=value; expires=…; Max-Age=…; path=…; domain=…; secure; httponly; samesite=none).
        // Appending the Partitioned token is spec-compliant and lets us
        // ship CHIPS without waiting for Symfony 6 / Laravel 11.
        $header = (string) $cookie . '; Partitioned';

        // false = append, don't replace — multiple Set-Cookie headers
        // on the same response are valid and necessary if other cookies
        // are being set in the same lifecycle.
        $response->headers->set('Set-Cookie', $header, false);
    }
}
