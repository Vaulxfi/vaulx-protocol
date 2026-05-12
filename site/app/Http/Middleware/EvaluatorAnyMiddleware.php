<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EvaluatorAnyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || (!$user->isEvaluator() && !$user->isAdmin())) {
            abort(403, 'Reserved to evaluators.');
        }
        return $next($request);
    }
}
