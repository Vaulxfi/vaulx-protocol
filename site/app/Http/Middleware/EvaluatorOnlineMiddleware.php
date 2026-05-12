<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EvaluatorOnlineMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || (!$user->isEvaluatorOnline() && !$user->isAdmin())) {
            abort(403, 'Reserved to online evaluators.');
        }
        return $next($request);
    }
}
