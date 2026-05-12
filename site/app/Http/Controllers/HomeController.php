<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FetchesCachedBridgeReads;
use App\Services\SolanaBridge;
use Illuminate\View\View;

/**
 * Public landing page. Used to be a closure in routes/web.php; promoted
 * to a real controller so the on-chain stats strip can pull live
 * `LoanConfig` + `Vault` data from the bridge with cache-on-success.
 */
class HomeController extends Controller
{
    use FetchesCachedBridgeReads;

    /**
     * Cache TTL for the public homepage's on-chain snapshot. Higher than
     * the admin dashboard (10s) because anonymous traffic spreads load
     * across many viewers — a 60s window keeps RPC pressure sane while
     * staying fresh enough for demo "live" framing.
     */
    private const ONCHAIN_CACHE_TTL_SECONDS = 60;

    /**
     * Method-injected `SolanaBridge` so the route stays simple and the
     * bridge singleton resolves only when this page is hit (matters in
     * tests + dev where the secret may not be configured).
     */
    public function index(SolanaBridge $bridge): View
    {
        $assetMint = (string) config('solana_bridge.demo_asset_mint');
        $onchain = [
            'asset_mint' => $assetMint,
            'loan_config' => $this->fetchCachedBridgeRead(
                'chain.home.loan-config',
                self::ONCHAIN_CACHE_TTL_SECONDS,
                fn () => $bridge->readLoanConfig(),
            ),
            'vault' => $this->fetchCachedBridgeRead(
                "chain.home.vault.{$assetMint}",
                self::ONCHAIN_CACHE_TTL_SECONDS,
                fn () => $bridge->readVault($assetMint),
            ),
            'fetched_at' => now()->toDateTimeString(),
        ];

        return view('home', compact('onchain'));
    }

    /**
     * Loan simulator page. Shows the same JS calculator as before plus a
     * "live capacity" banner sourced from the on-chain vault — anchors
     * the simulator's hypothetical maths to real-time protocol liquidity.
     * Only `readVault` is fetched here (no `readLoanConfig`) because
     * MAX_LTV and rates are protocol constants, not config-driven; the
     * simulator's sliders cover those.
     */
    public function simulator(SolanaBridge $bridge): View
    {
        $assetMint = (string) config('solana_bridge.demo_asset_mint');
        $onchain = [
            'asset_mint' => $assetMint,
            'vault' => $this->fetchCachedBridgeRead(
                "chain.simulator.vault.{$assetMint}",
                self::ONCHAIN_CACHE_TTL_SECONDS,
                fn () => $bridge->readVault($assetMint),
            ),
            'fetched_at' => now()->toDateTimeString(),
        ];

        return view('simulator', compact('onchain'));
    }
}
