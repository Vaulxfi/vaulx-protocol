<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Stateless token-in-URL authentication for the demo flow.
 *
 * Designed for the Colosseum partner walkthrough where the magic-link
 * session cookie may not survive a cross-origin iframe (Chrome's
 * third-party cookie phase-out, Safari ITP, etc.). The iframe loads
 * routes with `?token=<DEMO_MAGIC_TOKEN>` appended; this middleware
 * reads the token, picks the right demo user, and calls
 * `Auth::onceUsingId()` — a per-request authentication that DOES NOT
 * persist to session storage. The standard `auth` route middleware
 * downstream then sees `Auth::check() === true` for this request
 * only. No cookie, no session, no cross-origin concerns.
 *
 * Resolution order for which demo user to log in:
 *   1. Explicit `?as=admin` / `?as=borrower` query param
 *   2. Auto-detect from path prefix: `/admin/*` → admin, else borrower
 *
 * Behaviour: a valid `?token=` ALWAYS wins, even when a real session
 * is already authenticated. The real-world case that forced this:
 * Chrome sent a leftover dev session cookie on the iframe request
 * (cross-origin to the embedder, same-origin to vaulx.fi), the server
 * authenticated as the dev user, my earlier "session wins" branch
 * skipped token auth, and the controller's ownership check failed
 * (asset 47 belongs to demo-borrower, dev user owned nothing). Safari
 * ITP coincidentally blocked the leftover cookie so the same iframe
 * worked there. Token-wins-always normalises the behaviour and treats
 * the token as the only auth artifact in the demo path.
 *
 * Security posture: the token itself is the privileged secret. If a
 * real user has a leftover session AND somehow loads a URL with the
 * demo token appended, the demo persona takes over for that request.
 * That's the same effective surface as anyone-with-the-token getting
 * demo access directly — no new attack vector. Token rotates per
 * env (DEMO_MAGIC_TOKEN), unset env disables the path entirely.
 *
 * Safety:
 *   - No-op when there's no token query param.
 *   - Token comparison via `hash_equals` (constant-time).
 *   - Empty/unset `DEMO_MAGIC_TOKEN` denies by default — disabled
 *     environments stay disabled, not bypassed.
 *
 * Registered as a route-level middleware in the `web` group AFTER
 * StartSession (so session decryption is done by the time we run)
 * and BEFORE VerifyCsrfToken. See app/Http/Kernel.php.
 *
 * Companion: VerifyCsrfToken is extended to skip CSRF when a valid
 * demo token is present, otherwise iframe POSTs fail token-mismatch.
 */
class DemoTokenAuthenticator
{
    private const DEMO_BORROWER_EMAIL = 'demo-borrower@vaulx.fi';
    private const DEMO_ADMIN_EMAIL = 'demo-admin@vaulx.fi';

    public function handle(Request $request, Closure $next): Response
    {
        $supplied = (string) $request->query('token', '');
        if ($supplied === '' || ! $this->tokenMatches($supplied)) {
            return $next($request);
        }

        $email = $this->pickDemoEmail($request);
        $user = User::firstWhere('email', $email);
        if ($user) {
            // `onceUsingId` sets the guard's user, overriding any user
            // already loaded from the session for this request. No
            // session write, no cookie mutation — subsequent requests
            // re-validate the token from scratch.
            Auth::onceUsingId($user->id);
        }

        return $next($request);
    }

    private function tokenMatches(string $supplied): bool
    {
        $expected = (string) env('DEMO_MAGIC_TOKEN', '');
        if ($expected === '') {
            return false;
        }
        return hash_equals($expected, $supplied);
    }

    private function pickDemoEmail(Request $request): string
    {
        $as = (string) $request->query('as', '');
        if ($as === 'admin') {
            return self::DEMO_ADMIN_EMAIL;
        }
        if ($as === 'borrower') {
            return self::DEMO_BORROWER_EMAIL;
        }

        // Auto-pick by route prefix. The path() method returns the URI
        // without leading slash, so we compare against "admin" / "dashboard"
        // / "evaluator" prefixes directly.
        $path = $request->path();
        if ($path === 'admin' || str_starts_with($path, 'admin/')) {
            return self::DEMO_ADMIN_EMAIL;
        }

        // Borrower default covers /dashboard, /profile, and anywhere else
        // we'd want a logged-in non-admin to land. Evaluator demo isn't
        // seeded today; if added later, branch here for /evaluator.
        return self::DEMO_BORROWER_EMAIL;
    }
}
