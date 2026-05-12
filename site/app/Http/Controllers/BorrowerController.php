<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Evaluation;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Services\MarketPriceService;
use App\Services\SolanaBridge;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BorrowerController extends Controller
{
    public function dashboard()
    {
        $user = auth()->user();

        // Auto-redirect non-borrowers to their actual workspace. Login
        // scaffolding sends every authenticated user here by default,
        // which leaves evaluators (and admins via direct URL) staring at
        // an empty borrower dashboard.
        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }
        if ($user->isEvaluator()) {
            return redirect()->route('evaluator.dashboard');
        }

        $assets = $user->assets()->latest()->get();
        $loans = $user->loans()->with('asset')->latest()->get();

        $pendingDecisions = \App\Models\Evaluation::query()
            ->whereHas('asset', fn ($q) => $q->where('user_id', $user->id))
            ->where('status', \App\Models\Evaluation::STATUS_PENDING_OWNER)
            ->with('asset')
            ->get();

        $stats = [
            'total_assets' => $assets->count(),
            'active_loans' => $loans->where('status', 'active')->count(),
            'total_borrowed' => $loans->whereIn('status', ['active', 'overdue', 'repaid'])->sum('principal'),
            'outstanding' => $loans->whereIn('status', ['active', 'overdue'])->sum('outstanding_balance'),
        ];

        return view('borrower.dashboard', compact('assets', 'loans', 'stats', 'pendingDecisions'));
    }

    // =============================================
    // ETAPA 1 — Cadastro do Bem (simples)
    // =============================================
    public function createAsset(Request $request)
    {
        // ?demo=fill renders the same view with a typewriter+autosubmit
        // script appended. Optional knobs: ?delay=ms (default 7000),
        // ?fast=1 (skip animation), ?nosubmit=1 (fill but don't submit).
        // Token auth (?token=) is the gate for who can see this; this
        // flag only changes presentation.
        $demoFill = $request->query('demo') === 'fill';
        $demoFast = $request->query('fast') === '1';
        $demoNoSubmit = $request->query('nosubmit') === '1';
        $demoDelay = (int) $request->query('delay', 7000);

        return view('borrower.assets.create', compact('demoFill', 'demoFast', 'demoNoSubmit', 'demoDelay'));
    }

    public function storeAsset(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:watch,jewelry,art,vehicle',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'reference_number' => 'nullable|string|max:64',
            'serial_number' => 'nullable|string|max:255',
            'description' => 'required|string|max:2000',
            'condition' => 'required|in:excellent,good,fair',
            'estimated_value' => 'required|numeric|min:1000',
            'photos.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'photos' => 'nullable|array|max:6',
            'video' => 'nullable|file|mimes:mp4,mov,webm|max:15360', // 15MB
        ]);

        $validated['custody_status'] = 'pending_evaluation';
        unset($validated['photos'], $validated['photos.*'], $validated['video']);

        $asset = auth()->user()->assets()->create($validated);

        // Upload photos
        $photoUrls = [];
        if ($request->hasFile('photos')) {
            $uploadPath = public_path('upload/product');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0775, true);
            }
            foreach ($request->file('photos') as $photo) {
                $filename = 'asset_' . $asset->id . '_' . Str::random(8) . '.' . $photo->getClientOriginalExtension();
                $photo->move($uploadPath, $filename);
                $photoUrls[] = '/upload/product/' . $filename;
            }
            $asset->update(['photo_urls' => $photoUrls]);
        } elseif ($request->boolean('_demo_fill')) {
            // Demo autofill submits don't attach a photo (file inputs can't
            // be programmatically populated). Slot in the same Rolex stock
            // photo the seed uses so the asset detail page has visual
            // content instead of an empty gallery.
            $asset->update([
                'photo_urls' => [
                    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200&auto=format&fit=crop',
                ],
            ]);
        }

        // Upload optional video
        if ($request->hasFile('video')) {
            $uploadPath = public_path('upload/video');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0775, true);
            }
            $video = $request->file('video');
            $filename = 'asset_' . $asset->id . '_' . Str::random(8) . '.' . $video->getClientOriginalExtension();
            $video->move($uploadPath, $filename);
            $asset->update(['video_url' => '/upload/video/' . $filename]);
        }

        // Mock NFT (Devnet Demo)
        $asset->update([
            'nft_mint_address' => Str::random(43),
            'metadata_uri' => 'https://arweave.net/' . Str::random(43),
            'mint_tx_hash' => Str::random(87),
        ]);

        // Multi-layer evaluation (v1.2): create Evaluation + MarketSnapshot
        if (config('garantifi.features.evaluation_v12')) {
            $snapshot = app(MarketPriceService::class)->snapshotForAsset($asset->fresh());
            Evaluation::create([
                'asset_id' => $asset->id,
                'market_snapshot_id' => $snapshot?->id,
                'status' => Evaluation::STATUS_PENDING_ONLINE,
            ]);
        }

        return redirect()->route('borrower.dashboard')
            ->with('success', 'Asset registered! Awaiting online evaluation.');
    }

    public function showAsset(Asset $asset)
    {
        $this->authorizeOwner($asset);
        $asset->load('loans');
        return view('borrower.assets.show', compact('asset'));
    }

    // =============================================
    // ETAPA 3 — Solicitação de Empréstimo (wizard)
    // =============================================
    public function requestLoan(Request $request)
    {
        $assets = auth()->user()->assets()
            ->evaluated()
            ->get()
            ->filter(fn($a) => $a->isAvailableForLoan());

        // Demo autofill knobs — see createAsset() for the same set.
        $demoFill = $request->query('demo') === 'fill';
        $demoFast = $request->query('fast') === '1';
        $demoNoSubmit = $request->query('nosubmit') === '1';
        $demoDelay = (int) $request->query('delay', 7000);

        return view('borrower.loans.request', compact(
            'assets', 'demoFill', 'demoFast', 'demoNoSubmit', 'demoDelay'
        ));
    }

    public function storeLoan(Request $request, SolanaBridge $bridge)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'currency' => 'required|in:USDC,BRZ',
            'principal' => 'required|numeric|min:100',
            'term_months' => 'required|integer|in:3,6,12,18',
            'tx_hash' => 'nullable|string|min:10|max:128',
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);
        $this->authorizeOwner($asset);

        if (!$asset->isAvailableForLoan()) {
            return back()->with('error', 'This asset is not available for a loan.');
        }

        $principal = (float) $validated['principal'];
        $assetValue = (float) $asset->appraised_value;
        $maxLtvPct = (float) config('garantifi.lending.max_ltv_pct', 50);
        $ceiling = round($assetValue * ($maxLtvPct / 100), 2);

        if ($principal > $ceiling) {
            return back()->with('error', "Loan amount exceeds the available credit ceiling ({$maxLtvPct}% LTV).");
        }

        $interestRate = 24.00; // 24% a.a. / 2400 bps
        $originationFeePct = 2.50;
        $originationFee = round($principal * $originationFeePct / 100, 2);
        $ltv = $assetValue > 0 ? round(($principal / $assetValue) * 100, 2) : 0;
        $termMonths = (int) $validated['term_months'];

        // Mint the on-chain `trdc_state` PDA BEFORE persisting the Laravel
        // loan row. This way a bridge-side failure surfaces to the
        // borrower as a clean error and we don't leave a Laravel loan
        // stranded with no on-chain counterpart for the admin to approve.
        // Currency is hard-pinned to USDC for the on-chain side regardless
        // of the user's display preference (the protocol mints/holds USDC).
        $bridgeResult = $bridge->createCcbTrdc(
            appraisalAtoms: (int) round($assetValue * 1_000_000),
            loanAmountAtoms: (int) round($principal * 1_000_000),
            termDays: $termMonths * 30,
            rateBps: (int) round($interestRate * 100),
        );
        if (($bridgeResult['ok'] ?? false) !== true) {
            $errCode = $bridgeResult['error'] ?? 'bridge_unreachable';
            // Surface the bridge-side `details` field — that's the raw
            // Anchor / Solana error message, where the actual reason for
            // the rejection lives. Without this, every failure looks like
            // an opaque "onchain_error" in the log and we can't diagnose
            // which constraint the program tripped on.
            \Log::warning('createCcbTrdc bridge call failed', [
                'user_id' => auth()->id(),
                'asset_id' => $asset->id,
                'principal' => $principal,
                'asset_value' => $assetValue,
                'term_days' => $termMonths * 30,
                'rate_bps' => (int) round($interestRate * 100),
                'bridge_error' => $errCode,
                'bridge_status' => $bridgeResult['status'] ?? null,
                'bridge_details' => $bridgeResult['details'] ?? null,
                'bridge_payload' => $bridgeResult,
            ]);
            return back()->with(
                'error',
                "On-chain loan creation failed ({$errCode}). Please try again.",
            );
        }
        $solanaLoanId = (string) ($bridgeResult['loanId'] ?? '');
        $createCcbTx = (string) ($bridgeResult['txSignature'] ?? '');

        $loan = Loan::create([
            'code' => Loan::generateCode(),
            'user_id' => auth()->id(),
            'asset_id' => $asset->id,
            'status' => 'pending_custody',
            'asset_value' => $assetValue,
            'ltv_percent' => $ltv,
            'principal' => $principal,
            'interest_rate' => $interestRate,
            'origination_fee_percent' => $originationFeePct,
            'origination_fee' => $originationFee,
            'term_months' => $termMonths,
            'outstanding_balance' => $principal,
            'currency' => $validated['currency'],
            'escrow_address' => Str::random(43),
            'solana_loan_id' => $solanaLoanId,
        ]);

        // Persist the create_ccb_trdc tx to the on-chain events feed so the
        // /admin/onchain-events panel + the borrower's loan detail can show
        // the on-chain proof immediately, before the webhook listener
        // catches up via its log subscription.
        if ($createCcbTx !== '') {
            \App\Models\OnchainEvent::firstOrCreate(
                ['signature' => $createCcbTx, 'event_name' => 'ccb-trdc-created'],
                [
                    'event_name' => 'ccb-trdc-created',
                    'signature' => $createCcbTx,
                    'program_id' => 'loan',
                    'payload' => [
                        'source' => 'storeLoan',
                        'laravel_loan_code' => $loan->code,
                        'solana_loan_id' => $solanaLoanId,
                        'principal' => $principal,
                        'currency' => $loan->currency,
                    ],
                    'occurred_at' => now(),
                ],
            );
        }

        if (!empty($validated['tx_hash'])) {
            \App\Models\OnchainEvent::create([
                'event_name' => 'LoanRequested',
                'signature' => $validated['tx_hash'],
                'program_id' => config('garantifi.programs.loan') ?: 'memo',
                'payload' => [
                    'loan_code' => $loan->code,
                    'user_id' => $loan->user_id,
                    'principal' => $principal,
                    'currency' => $loan->currency,
                    'note' => 'Loan request signature (memo)',
                ],
                'occurred_at' => now(),
            ]);
        }

        $txDisplay = $createCcbTx !== '' ? substr($createCcbTx, 0, 16) . '…' : '(no-signature)';
        return redirect()->route('borrower.loan.show', $loan)
            ->with(
                'success',
                "✓ Loan {$loan->code} requested — on-chain trdc_state minted on devnet (tx {$txDisplay}). Awaiting custody approval.",
            );
    }

    public function showLoan(Loan $loan)
    {
        abort_unless($loan->user_id === auth()->id(), 403);
        $loan->load(['asset', 'payments', 'approver']);
        return view('borrower.loans.show', compact('loan'));
    }

    public function payInstallment(Request $request, LoanPayment $payment)
    {
        $loan = $payment->loan;
        abort_unless($loan->user_id === auth()->id(), 403);
        abort_unless(in_array($loan->status, ['active', 'overdue']), 403);
        abort_unless(in_array($payment->status, ['pending', 'overdue']), 422);

        $validated = $request->validate([
            'tx_hash' => 'required|string|min:10|max:88',
        ]);

        $payment->update([
            'status' => 'paid',
            'amount_paid' => $payment->amount_due,
            'paid_at' => today(),
            'tx_hash' => $validated['tx_hash'],
        ]);

        \App\Models\OnchainEvent::create([
            'event_name' => 'InstallmentPaid',
            'signature' => $validated['tx_hash'],
            'program_id' => config('garantifi.programs.loan') ?: 'memo',
            'payload' => [
                'loan_code' => $loan->code,
                'installment' => $payment->installment_number,
                'amount' => (float) $payment->amount_due,
                'currency' => $loan->currency,
            ],
            'occurred_at' => now(),
        ]);

        $loan->total_repaid = $loan->payments()->where('status', 'paid')->sum('amount_paid');
        $loan->outstanding_balance = max(0, $loan->principal - $loan->total_repaid);
        $loan->save();

        $allPaid = $loan->payments()->where('status', '!=', 'paid')->count() === 0;
        if ($allPaid) {
            $loan->update([
                'status' => 'repaid',
                'repaid_at' => now(),
                'outstanding_balance' => 0,
                'repayment_tx_hash' => $validated['tx_hash'],
            ]);

            $loan->asset->update(['custody_status' => 'released']);

            \App\Models\OnchainEvent::create([
                'event_name' => 'LoanRepaid',
                'signature' => $validated['tx_hash'],
                'program_id' => config('garantifi.programs.loan') ?: 'memo',
                'payload' => [
                    'loan_code' => $loan->code,
                    'note' => 'Final installment paid — cNFT released',
                ],
                'occurred_at' => now(),
            ]);

            try {
                $loan->user->notify(new \App\Notifications\LoanCompleted($loan));
            } catch (\Throwable $e) {
                \Log::warning('LoanCompleted notification failed', ['loan_id' => $loan->id, 'message' => $e->getMessage()]);
            }

            return redirect()->route('borrower.loan.show', $loan)
                ->with('success', 'Final installment paid! Loan repaid. Asset released from custody.');
        }

        return redirect()->route('borrower.loan.show', $loan)
            ->with('success', "Installment #{$payment->installment_number} paid successfully!");
    }

    public function myLoans()
    {
        $loans = auth()->user()->loans()->with('asset')->latest()->get();
        return view('borrower.loans.index', compact('loans'));
    }

    // =============================================
    // ETAPA 4 — Re-loan one-click (asset already evaluated)
    // =============================================
    public function showReloan(Asset $asset)
    {
        $this->authorizeOwner($asset);
        abort_unless(config('garantifi.features.reloan'), 404);
        abort_unless(\App\Models\Loan::reloanEligible($asset), 422, 'Asset not eligible for re-loan.');

        $previousLoan = $asset->loans()->where('status', 'repaid')->latest('repaid_at')->first();

        // Pre-fill suggestions from previous loan
        $defaults = [
            'currency' => $previousLoan->currency,
            'ltv' => (float) $previousLoan->ltv_percent,
            'term' => (int) $previousLoan->term_months,
            'principal' => round((float) $asset->appraised_value * ((float) $previousLoan->ltv_percent / 100), 2),
        ];

        return view('borrower.loans.reloan', compact('asset', 'previousLoan', 'defaults'));
    }

    public function storeReloan(Request $request, Asset $asset)
    {
        $this->authorizeOwner($asset);
        abort_unless(config('garantifi.features.reloan'), 404);
        abort_unless(\App\Models\Loan::reloanEligible($asset), 422, 'Asset not eligible for re-loan.');

        $validated = $request->validate([
            'currency' => 'required|in:USDC,BRZ',
            'principal' => 'required|numeric|min:100',
            'term_months' => 'required|integer|in:3,6,12,18',
            'tx_hash' => 'nullable|string|min:10|max:128',
        ]);

        $assetValue = (float) $asset->appraised_value;
        $principal = (float) $validated['principal'];
        $maxLtvPct = (float) config('garantifi.lending.max_ltv_pct', 50);
        $ceiling = round($assetValue * ($maxLtvPct / 100), 2);
        if ($principal > $ceiling) {
            return back()->with('error', "Re-loan amount exceeds the available credit ceiling ({$maxLtvPct}% LTV).");
        }

        $interestRate = 24.00;
        $originationFeePct = 2.50;
        $originationFee = round($principal * $originationFeePct / 100, 2);
        $ltv = $assetValue > 0 ? round(($principal / $assetValue) * 100, 2) : 0;

        $loan = \App\Models\Loan::create([
            'code' => \App\Models\Loan::generateCode(),
            'user_id' => auth()->id(),
            'asset_id' => $asset->id,
            'status' => 'pending_custody',
            'asset_value' => $assetValue,
            'ltv_percent' => $ltv,
            'principal' => $principal,
            'interest_rate' => $interestRate,
            'origination_fee_percent' => $originationFeePct,
            'origination_fee' => $originationFee,
            'term_months' => $validated['term_months'],
            'outstanding_balance' => $principal,
            'currency' => $validated['currency'],
            'escrow_address' => Str::random(43),
            'admin_notes' => 'Re-loan from previous (asset already evaluated, skipping evaluation pipeline)',
        ]);

        if (!empty($validated['tx_hash'])) {
            \App\Models\OnchainEvent::create([
                'event_name' => 'ReloanRequested',
                'signature' => $validated['tx_hash'],
                'program_id' => config('garantifi.programs.loan') ?: 'memo',
                'payload' => [
                    'loan_code' => $loan->code,
                    'user_id' => $loan->user_id,
                    'principal' => $principal,
                    'currency' => $loan->currency,
                    'reloan' => true,
                ],
                'occurred_at' => now(),
            ]);
        }

        return redirect()->route('borrower.loan.show', $loan)
            ->with('success', "Re-loan request created. Asset already in our records — admin approval is faster than first-time loans.");
    }

    private function authorizeOwner(Asset $asset)
    {
        abort_unless($asset->user_id === auth()->id(), 403);
    }
}
