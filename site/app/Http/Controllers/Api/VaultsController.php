<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SolanaBridge;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * `/api/vaults` — admin/vaults page snapshot. Replaces the old per-token
 * (USDC + BRZ) iteration that filled both with empty/mocked fields. Now
 * we read the SINGLE real on-chain vault via the Solana bridge and
 * compute lent/available from Laravel-side loan accounting.
 *
 * BRZ vault never existed on-chain (no `initialize_vault` for that mint),
 * so it's intentionally dropped from this list — surfacing it would have
 * been an "OFFCHAIN" placeholder, which is exactly what we're getting
 * away from.
 */
class VaultsController extends Controller
{
    public function __construct(protected SolanaBridge $bridge)
    {
    }

    public function index(): JsonResponse
    {
        $assetMint = (string) config('solana_bridge.demo_asset_mint');
        $tokenCfg = (array) (config('garantifi.tokens.USDC') ?? []);

        // Active-loan accounting (USDC-denominated only — the on-chain
        // vault disburses USDC; BRZ-denominated loans never touched it).
        // CRITICAL: only count loans that actually drew from the real
        // on-chain vault. A Laravel row with no `confirm_custody_tx` (or
        // a placeholder one) never triggered disburse_from_vault, so its
        // principal is fictitious from the vault's perspective. Without
        // this filter, legacy seeded loans inflate "lent" past total
        // deposits and the Available widget goes negative.
        $totals = DB::table('loans')
            ->selectRaw('SUM(principal) as lent_total, SUM(total_repaid) as repaid_total, COUNT(*) as cnt')
            ->whereIn('status', ['active', 'overdue'])
            ->where('currency', 'USDC')
            ->whereNotNull('confirm_custody_tx')
            ->where('confirm_custody_tx', '!=', '')
            ->where('confirm_custody_tx', 'not like', 'placeholder-%')
            ->first();
        $lent = $totals
            ? max(0.0, (float) $totals->lent_total - (float) $totals->repaid_total)
            : 0.0;
        $activeLoans = $totals ? (int) $totals->cnt : 0;

        $bridgeRead = $this->bridge->readVault($assetMint);
        $isLive = ($bridgeRead['ok'] ?? false) === true;
        $fields = $bridgeRead['data']['fields'] ?? [];
        $totalAssetsAtoms = (int) ($fields['total_assets'] ?? 0);
        $totalSharesAtoms = (int) ($fields['total_shares'] ?? 0);
        $deposited = $totalAssetsAtoms / 1_000_000;

        // Available = on-chain ledger minus what Laravel knows is lent.
        // If the two go out of sync (e.g. disburse landed on-chain but
        // Laravel never saw the loan), we surface it as a non-negative
        // floor so the UI doesn't show a negative number.
        $available = max(0.0, $deposited - $lent);

        return response()->json([
            'vaults' => [
                'USDC' => [
                    'symbol' => 'USDC',
                    'name' => $tokenCfg['name'] ?? 'USD Coin',
                    'prefix' => $tokenCfg['prefix'] ?? '$',
                    'decimals' => $tokenCfg['decimals'] ?? 6,
                    'mint' => $assetMint,
                    'pda' => $bridgeRead['data']['pda'] ?? null,
                    'deposited' => round($deposited, 2),
                    'lent' => round($lent, 2),
                    'available' => round($available, 2),
                    'active_loans' => $activeLoans,
                    'total_shares' => $totalSharesAtoms,
                    'slot' => $bridgeRead['data']['slot'] ?? null,
                    'is_live' => $isLive,
                    'is_paused' => false,
                    'bridge_error' => $isLive ? null : ($bridgeRead['error'] ?? 'unknown'),
                ],
            ],
            'as_of' => now()->toIso8601String(),
        ]);
    }
}
