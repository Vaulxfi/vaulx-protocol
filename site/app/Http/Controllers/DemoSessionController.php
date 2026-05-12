<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Demo magic-link session.
 *
 * Designed for the Colosseum partner walkthrough: a single env-scoped token
 * (DEMO_MAGIC_TOKEN) gates two endpoints that together stand up a one-click
 * "log in as a demo user mid-flow" experience without showing a form:
 *
 *   GET  /demo?token=…                        → demo-borrower → /dashboard
 *   GET  /demo?token=…&as=admin               → demo-admin    → /admin
 *   GET  /demo?token=…&as=admin&next=/admin/loan/47
 *                                             → demo-admin    → /admin/loan/47
 *   POST /api/demo/reset                      → re-runs `php artisan demo:seed`
 *
 * Both endpoints compare the token in constant time (hash_equals). The
 * magic-link endpoint mutates the session cookie attributes for THIS
 * REQUEST ONLY (SameSite=None + Secure), so the session can be embedded
 * cross-origin (e.g. a partner site iframing /dashboard). Default session
 * cookie behaviour (SameSite=Lax) is untouched for every other route — see
 * `relaxSessionCookieForCrossOrigin()` below.
 *
 * The `next` query param is whitelisted (must start with `/` and a known
 * prefix) to prevent open-redirect abuse — see `safeNextPath()`.
 */
class DemoSessionController extends Controller
{
    private const DEMO_BORROWER_EMAIL = 'demo-borrower@vaulx.fi';
    private const DEMO_ADMIN_EMAIL = 'demo-admin@vaulx.fi';

    /** Allowed prefixes for the optional `next` redirect param. */
    private const NEXT_WHITELIST = ['/dashboard', '/admin', '/evaluator', '/profile'];

    public function magicLink(Request $request): RedirectResponse|Response
    {
        $supplied = (string) $request->query('token', '');
        if (! $this->tokenMatches($supplied)) {
            Log::warning('demo magic-link: token mismatch', [
                'ip' => $request->ip(),
                'len' => strlen($supplied),
            ]);
            abort(403, 'Invalid demo token.');
        }

        $asAdmin = $request->query('as') === 'admin';
        $email = $asAdmin ? self::DEMO_ADMIN_EMAIL : self::DEMO_BORROWER_EMAIL;

        $user = User::firstWhere('email', $email);
        if (! $user) {
            Log::error('demo magic-link: demo user missing — run `php artisan demo:seed`', [
                'role' => $asAdmin ? 'admin' : 'borrower',
            ]);
            abort(503, 'Demo state not initialised on this environment.');
        }

        // Cross-origin cookie is only safe-by-default on the demo route —
        // never leak it to the rest of the app. Setting the request-scoped
        // session config keys is enough because StartSession reads
        // `config('session.*')` dynamically inside addCookieToResponse(),
        // which runs after this controller returns. Verified against
        // illuminate/session/Middleware/StartSession.php (Laravel 8).
        $this->relaxSessionCookieForCrossOrigin();

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $next = $this->safeNextPath($request->query('next'));
        if ($next !== null) {
            return redirect()->to($next);
        }

        return redirect()->route($asAdmin ? 'admin.dashboard' : 'borrower.dashboard');
    }

    public function reset(Request $request): JsonResponse
    {
        $supplied = (string) $request->header('X-Demo-Token', '');
        if (! $this->tokenMatches($supplied)) {
            return response()->json(['ok' => false, 'error' => 'invalid_token'], 403);
        }

        try {
            Artisan::call('demo:seed');
        } catch (\Throwable $e) {
            Log::error('demo reset failed', ['message' => $e->getMessage()]);
            return response()->json([
                'ok' => false,
                'error' => 'seed_failed',
                'detail' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'ok' => true,
            'output' => trim(Artisan::output()),
        ]);
    }

    /**
     * Constant-time token comparison. Both sides are normalised to strings
     * so PHP doesn't short-circuit on type juggling. Returns false if the
     * server-side token is unset (defensive — refuses to authenticate when
     * misconfigured) or if either side is empty.
     */
    private function tokenMatches(string $supplied): bool
    {
        $expected = (string) env('DEMO_MAGIC_TOKEN', '');
        if ($expected === '' || $supplied === '') {
            return false;
        }
        return hash_equals($expected, $supplied);
    }

    /**
     * Per-request session-cookie attribute override. Sets `same_site=none`
     * and `secure=true` so the browser will accept the cookie when the
     * dashboard is later loaded from a third-party origin (iframe / partner
     * embed). Affects only the response generated by this action — config()
     * mutations don't persist across requests.
     */
    private function relaxSessionCookieForCrossOrigin(): void
    {
        config([
            'session.same_site' => 'none',
            'session.secure' => true,
        ]);
    }

    /**
     * Whitelist-validate the optional `next` query param.
     *
     * Open-redirect surface mitigations:
     *  - must be a non-empty string
     *  - must start with a single `/` (not `//`, which would be
     *    protocol-relative)
     *  - first path segment must match one of NEXT_WHITELIST
     *
     * Returns the path unchanged when safe, or null when not — callers
     * fall back to the role's default dashboard on null.
     */
    private function safeNextPath(mixed $next): ?string
    {
        if (! is_string($next) || $next === '') {
            return null;
        }
        if (! str_starts_with($next, '/') || str_starts_with($next, '//')) {
            return null;
        }
        foreach (self::NEXT_WHITELIST as $prefix) {
            if ($next === $prefix || str_starts_with($next, $prefix.'/')) {
                return $next;
            }
        }
        return null;
    }
}
