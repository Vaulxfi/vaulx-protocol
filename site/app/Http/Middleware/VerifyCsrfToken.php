<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];

    /**
     * Override the parent to short-circuit CSRF when the request carries
     * a valid demo token in `?token=`. Without this bypass, iframe POSTs
     * authenticated by DemoTokenAuthenticator would still fail with
     * TokenMismatchException — the iframe has no access to the session-
     * scoped XSRF cookie under cross-origin embedding.
     *
     * Security posture: the demo token itself is the authorization
     * artifact (rotates per environment, single shared secret). Any
     * caller who already proved knowledge of the token has, by design,
     * the same privileges as a logged-in demo user. CSRF protection on
     * top of that adds no additional security surface — it would only
     * block legitimate iframe flows.
     */
    public function handle($request, Closure $next)
    {
        if ($this->requestBearsValidDemoToken($request)) {
            return $next($request);
        }
        return parent::handle($request, $next);
    }

    /**
     * Constant-time comparison; mirrors DemoTokenAuthenticator's check
     * so behaviour stays in sync if one is touched. Empty/unset env
     * denies — disabled environments are not silently bypassed.
     */
    private function requestBearsValidDemoToken($request): bool
    {
        $expected = (string) env('DEMO_MAGIC_TOKEN', '');
        if ($expected === '') {
            return false;
        }
        $supplied = (string) $request->query('token', '');
        if ($supplied === '') {
            return false;
        }
        return hash_equals($expected, $supplied);
    }
}
