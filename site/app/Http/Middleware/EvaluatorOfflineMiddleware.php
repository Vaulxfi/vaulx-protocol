<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EvaluatorOfflineMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || (!$user->isEvaluatorOffline() && !$user->isAdmin())) {
            abort(403, 'Reserved to offline evaluators.');
        }
        return $next($request);
    }
}
