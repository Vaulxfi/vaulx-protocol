<?php

namespace App\Providers;

use App\Services\CurrencyService;
use App\Services\MarketPriceService;
use App\Services\SolanaBridge;
use App\Services\SolanaService;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(CurrencyService::class);
        $this->app->singleton(SolanaService::class);
        $this->app->singleton(MarketPriceService::class);

        // SolanaBridge is constructed even when the shared secret is unset
        // — the service detects an empty secret/base URL and short-circuits
        // every call as `ok:false, error:bridge_not_configured` without
        // making any HTTP request. Controllers + views already handle
        // `ok:false` gracefully, so the public homepage / simulator and
        // the admin dashboard render their offline fallback copy on a
        // bridge-less environment instead of 500ing at the binding level.
        $this->app->singleton(SolanaBridge::class, function () {
            return new SolanaBridge(
                (string) (config('solana_bridge.base_url') ?? ''),
                (string) (config('solana_bridge.shared_secret') ?? ''),
                (int) (config('solana_bridge.timeout_seconds') ?? 30),
            );
        });
    }

    public function boot()
    {
        View::composer('*', function ($view) {
            $view->with('gfNetwork', config('garantifi.network'));
            $view->with('gfTokens', config('garantifi.tokens'));
        });
    }
}
