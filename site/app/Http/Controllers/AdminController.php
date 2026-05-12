<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FetchesCachedBridgeReads;
use App\Models\Asset;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\User;
use App\Notifications\AssetEvaluated;
use App\Notifications\LoanApproved;
use App\Services\InterestCalculator;
use App\Services\SolanaBridge;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    use FetchesCachedBridgeReads;

    /**
     * Cache TTL for on-chain dashboard reads. 10s is short enough that a
     * demo F5 surfaces fresh data, long enough that we don't hammer the
     * RPC on every page load. Higher than the public homepage TTL because
     * authenticated admin traffic is small and we want fresher numbers.
     */
    private const ONCHAIN_CACHE_TTL_SECONDS = 10;

    /**
     * Method-injected `SolanaBridge` keeps the rest of the AdminController
     * actions independent of the bridge config — admins can hit any other
     * route without resolving the singleton (which throws if the shared
     * secret is unset).
     */
    public function dashboard(SolanaBridge $bridge)
    {
        // Restrict "real-money" stats to loans that actually ran through
        // disburse_from_vault on-chain (i.e. have a non-placeholder
        // confirm_custody_tx). Mirrors VaultsController so the dashboard
        // top cards never disagree with /admin/vaults — without this
        // filter, legacy seeded loans inflate every $-figure and the
        // active count, which makes the on-chain snapshot card below
        // (real bridge read) look out of sync with the cards above.
        // pending_custody and the donut are intentionally NOT filtered:
        // pending_custody loans have no confirm tx by design, and the
        // donut is descriptive of pipeline state, not money flow.
        $onchainConfirmed = fn ($q) => $q
            ->whereNotNull('confirm_custody_tx')
            ->where('confirm_custody_tx', '!=', '')
            ->where('confirm_custody_tx', 'not like', 'placeholder-%');

        $stats = [
            'total_users' => User::where('role', 'borrower')->count(),
            'total_assets' => Asset::count(),
            'total_loans' => Loan::count(),
            'pending_evaluation' => Asset::pendingEvaluation()->count(),
            'pending_custody' => Loan::pendingCustody()->count(),
            'active_loans' => $onchainConfirmed(Loan::active())->count(),
            'overdue_loans' => $onchainConfirmed(Loan::overdue())->count(),
            'total_principal' => $onchainConfirmed(Loan::whereIn('status', ['active', 'overdue', 'repaid']))->sum('principal'),
            'total_outstanding' => $onchainConfirmed(Loan::whereIn('status', ['active', 'overdue']))->sum('outstanding_balance'),
            'total_repaid' => $onchainConfirmed(Loan::query())->sum('total_repaid'),
            'total_origination_fees' => $onchainConfirmed(Loan::whereIn('status', ['active', 'overdue', 'repaid']))->sum('origination_fee'),
        ];

        $loansByStatus = Loan::query()
            ->selectRaw('status, COUNT(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status')
            ->toArray();

        $pendingAssets = Asset::pendingEvaluation()->with('user')->latest()->take(10)->get();
        $pendingLoans = Loan::pendingCustody()->with(['user', 'asset'])->latest()->take(10)->get();
        $recentLoans = Loan::with(['user', 'asset'])->latest()->take(10)->get();

        $assetMint = (string) config('solana_bridge.demo_asset_mint');
        $onchain = [
            'asset_mint' => $assetMint,
            'loan_config' => $this->fetchCachedBridgeRead(
                'chain.admin.loan-config',
                self::ONCHAIN_CACHE_TTL_SECONDS,
                fn () => $bridge->readLoanConfig(),
            ),
            'vault' => $this->fetchCachedBridgeRead(
                "chain.admin.vault.{$assetMint}",
                self::ONCHAIN_CACHE_TTL_SECONDS,
                fn () => $bridge->readVault($assetMint),
            ),
            'fetched_at' => now()->toDateTimeString(),
        ];

        return view('admin.dashboard', compact(
            'stats',
            'pendingAssets',
            'pendingLoans',
            'recentLoans',
            'loansByStatus',
            'onchain',
        ));
    }


    // --- Asset Evaluation (ETAPA 2) ---
    public function pendingAssets()
    {
        $assets = Asset::pendingEvaluation()->with('user')->latest()->paginate(20);
        return view('admin.assets.index', compact('assets'));
    }

    public function evaluateAsset(Asset $asset)
    {
        $asset->load('user');

        // If a Triple Validation evaluation exists for this asset, surface
        // the online + offline reports + the consolidated final value so
        // the admin approves the price the EVALUATORS landed on, not the
        // one the borrower originally requested. Older legacy assets
        // without an Evaluation row fall back to estimated_value.
        $evaluation = $asset->evaluation()->with(['onlineReport', 'offlineReport'])->first();

        return view('admin.assets.evaluate', compact('asset', 'evaluation'));
    }

    public function approveEvaluation(Request $request, Asset $asset)
    {
        if (!$asset->isPendingEvaluation()) {
            return back()->with('error', 'This asset is not awaiting evaluation.');
        }

        $validated = $request->validate([
            'appraised_value' => 'required|numeric|min:100',
            'condition' => 'required|in:excellent,good,fair',
            'custody_location' => 'required|string|max:255',
        ]);

        $asset->update([
            'appraised_value' => $validated['appraised_value'],
            'condition' => $validated['condition'],
            'appraiser' => auth()->user()->name,
            'appraisal_date' => today(),
            'custody_status' => 'evaluated',
            'custody_location' => $validated['custody_location'],
        ]);

        try {
            $asset->user->notify(new AssetEvaluated($asset));
        } catch (\Throwable $e) {
            \Log::warning('AssetEvaluated notification failed', ['asset_id' => $asset->id, 'message' => $e->getMessage()]);
        }

        return redirect()->route('admin.assets.pending')
            ->with('success', "Asset \"{$asset->brand} {$asset->model}\" evaluated at \${$validated['appraised_value']}. Client notified.");
    }

    // --- Loans Management ---
    public function loans(Request $request)
    {
        $query = Loan::with(['user', 'asset']);

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $loans = $query->latest()->paginate(20);

        return view('admin.loans.index', compact('loans'));
    }

    public function showLoan(Loan $loan)
    {
        $loan->load(['user', 'asset', 'payments', 'approver']);
        return view('admin.loans.show', compact('loan'));
    }

    /**
     * Approve custody = the load-bearing security gate of the protocol.
     *
     * Flow (post-bridge wiring):
     *   1. Resolve a stable `solana_loan_id` for the loan and persist it
     *      if missing — the bridge derives PDAs from this and we want the
     *      same value across retries / page refreshes.
     *   2. Call the bridge's `confirmCustodyAndDisburse`. The bridge is
     *      currently in placeholder mode (returns `_placeholder: true` +
     *      a `placeholder-confirm-custody-<unix>` signature) but the
     *      contract from this controller's POV is the same — `ok: true`
     *      means "on-chain confirmation succeeded, loan can be activated".
     *   3. **If the bridge call fails for any reason** — bridge offline,
     *      bad signature, on-chain ix reverted — we BLOCK the activation.
     *      This matches the product pitch ("money cannot disburse without
     *      on-chain custody confirmation"): we'd rather have a demo
     *      surface a clear error than silently fall back to the mock.
     *   4. On success, persist the txSignature in `confirm_custody_tx`,
     *      transition the loan via the existing model method, and notify
     *      the borrower.
     */
    public function approveCustody(Loan $loan, SolanaBridge $bridge)
    {
        if ($loan->status !== 'pending_custody') {
            return back()->with('error', 'This loan is not pending custody.');
        }

        // Backfill the on-chain identifier on first approval. Reading
        // `$loan->solana_loan_id` calls the accessor which deterministically
        // derives a base58 32-byte pubkey from the DB id when the column is
        // null — same value every time, so retrying the action after a
        // transient bridge failure passes the bridge the identical loanId.
        if (empty($loan->getRawOriginal('solana_loan_id'))) {
            $loan->update(['solana_loan_id' => $loan->solana_loan_id]);
        }

        $result = $bridge->confirmCustodyAndDisburse($loan->solana_loan_id);
        if (($result['ok'] ?? false) !== true) {
            $errCode = $result['error'] ?? 'bridge_unreachable';
            \Log::warning('confirmCustody bridge call failed', [
                'loan_id' => $loan->id,
                'solana_loan_id' => $loan->solana_loan_id,
                'bridge_error' => $errCode,
                'bridge_status' => $result['status'] ?? null,
            ]);
            return back()->with(
                'error',
                "On-chain custody confirmation failed ({$errCode}). Loan {$loan->code} was NOT activated. " .
                "Verify the bridge is reachable and try again.",
            );
        }

        $txSignature = (string) ($result['txSignature'] ?? '');
        $loan->update(['confirm_custody_tx' => $txSignature]);
        $loan->activateAsApproved(approverId: (int) auth()->id());

        try {
            $loan->user->notify(new LoanApproved($loan));
        } catch (\Throwable $e) {
            \Log::warning('LoanApproved notification failed', ['loan_id' => $loan->id, 'message' => $e->getMessage()]);
        }

        $txDisplay = $txSignature !== '' ? substr($txSignature, 0, 16) . '…' : '(no-signature)';
        $principal = number_format((float) $loan->principal, 2);
        return back()->with(
            'success',
            "✓ Loan {$loan->code} active on devnet — custody confirmed, " .
            "{$principal} {$loan->currency} disbursed (tx {$txDisplay}).",
        );
    }

    public function markDefaulted(Loan $loan)
    {
        if (!in_array($loan->status, ['active', 'overdue'])) {
            return back()->with('error', 'Invalid status to mark as defaulted.');
        }

        $loan->update([
            'status' => 'defaulted',
            'defaulted_at' => now(),
        ]);

        return back()->with('success', "Loan {$loan->code} marked as defaulted.");
    }

    public function markRepaid(Loan $loan)
    {
        if (!in_array($loan->status, ['active', 'overdue'])) {
            return back()->with('error', 'Invalid status to mark as repaid.');
        }

        $loan->update([
            'status' => 'repaid',
            'repaid_at' => now(),
            'total_repaid' => $loan->principal,
            'outstanding_balance' => 0,
            'repayment_tx_hash' => Str::random(87),
        ]);

        // Mark all pending payments as paid
        $loan->payments()->where('status', '!=', 'paid')->update([
            'status' => 'paid',
            'amount_paid' => \DB::raw('amount_due'),
            'paid_at' => today(),
            'tx_hash' => Str::random(87),
        ]);

        // Release asset
        $loan->asset->update([
            'custody_status' => 'released',
        ]);

        return back()->with('success', "Loan {$loan->code} repaid! Asset released.");
    }

    // --- Vaults ---
    public function vaults()
    {
        return view('admin.vaults');
    }

    // --- Multisig ---
    // Reads the canonical off-chain snapshot from config/squads.php (mirror
    // of vaulx-protocol/scripts/dev/squads-multisig.json). The view renders
    // the live multisig PDA + members; pending-transaction state is NOT
    // surfaced here because that requires a bridge endpoint we haven't
    // built — never re-add the hardcoded "TX-0042" placeholder rows.
    public function multisig()
    {
        return view('admin.multisig', [
            'multisig' => config('squads'),
        ]);
    }

    // --- Eventos On-chain ---
    public function eventosOnchain()
    {
        return view('admin.eventos-onchain');
    }

    // --- Cron Bot ---
    public function cronBot()
    {
        return view('admin.cron-bot');
    }

    // --- Monitor BRZ ---
    public function monitorBrz()
    {
        return view('admin.monitor-brz');
    }

    // --- Users ---
    public function users()
    {
        $users = User::withCount(['assets', 'loans'])->latest()->paginate(20);
        return view('admin.users.index', compact('users'));
    }

}
