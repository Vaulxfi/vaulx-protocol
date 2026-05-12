<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Asset;

/**
 * Borrower-facing transparency layer for an Asset's lifecycle.
 *
 * Three public APIs:
 *   - for($asset)         → short "next step" line for the table row.
 *   - currentStep($asset) → integer 1..6 of the canonical journey.
 *   - journey($asset)     → full payload for the timeline + detail block.
 *
 * The 6 canonical steps that any asset moves through (some get skipped
 * if the user takes the re-loan path):
 *   1. Submitted   — asset registered, awaiting evaluator
 *   2. Evaluating  — Triple Validation in progress
 *   3. Decision    — appraisal range ready, owner decides
 *   4. Custody     — physical asset shipped + received
 *   5. Loan active — USDC disbursed, repaying installments
 *   6. Released    — loan repaid, asset returned (or re-loan)
 */
class AssetStatusGuide
{
    public const STEPS = [
        1 => 'Submitted',
        2 => 'Evaluating',
        3 => 'Decision',
        4 => 'Custody',
        5 => 'Loan active',
        6 => 'Released',
    ];

    public const TOTAL_STEPS = 6;

    /**
     * Compact "next step" guidance, used in tables / row badges.
     *
     * @return array{kind: string, eta_label: ?string, text: ?string}
     */
    public static function for(Asset $asset): array
    {
        $loan = $asset->loans()->latest('id')->first();

        switch ($asset->custody_status) {
            case 'pending_evaluation':
                return [
                    'kind' => 'waiting',
                    'eta_label' => 'ETA 24–48h',
                    'text' => 'awaiting our evaluator team',
                ];

            case 'evaluated':
                if (!$loan) {
                    return [
                        'kind' => 'action',
                        'eta_label' => 'READY',
                        'text' => 'request a loan whenever you want',
                    ];
                }
                if ($loan->status === 'pending_custody') {
                    return [
                        'kind' => 'action',
                        'eta_label' => '→ ACTION',
                        'text' => 'ship asset to our SP vault — check your email for instructions',
                    ];
                }
                return [
                    'kind' => 'waiting',
                    'eta_label' => 'READY',
                    'text' => 'appraisal complete',
                ];

            case 'in_transit':
                return [
                    'kind' => 'waiting',
                    'eta_label' => 'IN TRANSIT',
                    'text' => 'asset on its way to our vault',
                ];

            case 'in_custody':
                if (!$loan) {
                    return [
                        'kind' => 'waiting',
                        'eta_label' => 'IN CUSTODY',
                        'text' => 'asset received, awaiting loan activation',
                    ];
                }
                if ($loan->status === 'overdue') {
                    return [
                        'kind' => 'warning',
                        'eta_label' => '⚠ OVERDUE',
                        'text' => 'settle past-due payments to avoid default',
                    ];
                }
                if ($loan->status === 'active') {
                    return self::nextInstallmentText($loan);
                }
                if ($loan->status === 'pending_custody') {
                    return [
                        'kind' => 'waiting',
                        'eta_label' => 'ETA 1–3 days',
                        'text' => 'vault confirming receipt',
                    ];
                }
                if ($loan->status === 'defaulted') {
                    return [
                        'kind' => 'warning',
                        'eta_label' => 'DEFAULTED',
                        'text' => 'asset transferred to recovery — contact support',
                    ];
                }
                break;

            case 'released':
                if ($loan && $loan->status === 'repaid') {
                    return [
                        'kind' => 'done',
                        'eta_label' => '✓ COMPLETE',
                        'text' => 'loan repaid · ready for a re-loan whenever you want',
                    ];
                }
                return [
                    'kind' => 'done',
                    'eta_label' => 'RELEASED',
                    'text' => 'asset back in your possession',
                ];

            case 'with_owner':
                return [
                    'kind' => 'waiting',
                    'eta_label' => 'WITH YOU',
                    'text' => 'asset is in your possession',
                ];
        }

        return [
            'kind' => 'waiting',
            'eta_label' => null,
            'text' => null,
        ];
    }

    /**
     * Maps custody_status × loan status into a step number 1..6.
     */
    public static function currentStep(Asset $asset): int
    {
        $loan = $asset->loans()->latest('id')->first();

        switch ($asset->custody_status) {
            case 'pending_evaluation': return 2;
            case 'evaluated':
                if ($loan && $loan->status === 'pending_custody') return 4;
                return 3;
            case 'in_transit': return 4;
            case 'in_custody':
                if ($loan && $loan->status === 'pending_custody') return 4;
                return 5;
            case 'released':
            case 'with_owner':
                return 6;
        }
        return 1;
    }

    /**
     * Full journey payload: short guidance + step number + who's acting +
     * what the user does + preview of what comes next + submitted_at.
     *
     * Used by the timeline component on the asset detail page.
     *
     * @return array{
     *   kind: string,
     *   eta_label: ?string,
     *   text: ?string,
     *   current_step: int,
     *   total_steps: int,
     *   step_titles: array<int,string>,
     *   progress_percent: int,
     *   step_dates: array<int,?\Illuminate\Support\Carbon>,
     *   who_acting: string,
     *   what_you_do: string,
     *   next_steps_preview: array<int,array{title: string, desc: string}>,
     * }
     */
    public static function journey(Asset $asset): array
    {
        $base = self::for($asset);
        $current = self::currentStep($asset);

        return array_merge($base, [
            'current_step' => $current,
            'total_steps' => self::TOTAL_STEPS,
            'step_titles' => self::STEPS,
            'progress_percent' => (int) round(($current / self::TOTAL_STEPS) * 100),
            'step_dates' => self::stepDates($asset),
            'who_acting' => self::whoActing($base['kind']),
            'what_you_do' => self::whatYouDo($base['kind'], $asset),
            'next_steps_preview' => self::nextStepsPreview($current),
        ]);
    }

    // -------- internal helpers --------

    /**
     * Builds the "due Apr 15 · pay installment 4 of 12" line for an active loan.
     *
     * @return array{kind: string, eta_label: ?string, text: ?string}
     */
    protected static function nextInstallmentText($loan): array
    {
        $next = $loan->payments()
            ->whereNull('paid_at')
            ->orderBy('due_date')
            ->first();

        if (!$next) {
            return [
                'kind' => 'waiting',
                'eta_label' => 'ALL PAID',
                'text' => 'awaiting final settlement',
            ];
        }

        $paidCount = $loan->payments()->whereNotNull('paid_at')->count();
        $totalCount = $loan->payments()->count();
        $when = $next->due_date->format('M d');
        $isOverdue = $next->due_date->isPast();

        return [
            'kind' => $isOverdue ? 'warning' : 'action',
            'eta_label' => $isOverdue ? '⚠ ' . $when : '📅 due ' . $when,
            'text' => "pay installment ({$paidCount} of {$totalCount} paid)",
        ];
    }

    /**
     * @return array<int, ?\Illuminate\Support\Carbon>
     */
    protected static function stepDates(Asset $asset): array
    {
        $loan = $asset->loans()->latest('id')->first();
        $dates = [
            1 => $asset->created_at,
            2 => null,
            3 => $asset->appraisal_date,
            4 => $asset->custody_received_at,
            5 => $loan?->disbursed_at,
            6 => $loan?->repaid_at,
        ];
        // step 2 (Evaluating) — no canonical timestamp on the asset; leave null.
        return $dates;
    }

    protected static function whoActing(string $kind): string
    {
        return match ($kind) {
            'action'  => 'You',
            'warning' => 'You',
            'done'    => 'Complete',
            default   => 'Vaulx team',
        };
    }

    protected static function whatYouDo(string $kind, Asset $asset): string
    {
        $loan = $asset->loans()->latest('id')->first();

        if ($kind === 'waiting') {
            return 'Nothing — we\'ll email you when the next step is ready.';
        }
        if ($kind === 'done') {
            if ($loan && $loan->status === 'repaid') {
                return 'Pick up your asset, or instantly re-loan against the same appraisal.';
            }
            return 'Asset is back with you. Re-loan whenever you want.';
        }

        // action / warning
        switch ($asset->custody_status) {
            case 'evaluated':
                if (!$loan) {
                    return 'Click "Request Loan" to choose currency, amount and term.';
                }
                if ($loan->status === 'pending_custody') {
                    return 'Ship the asset to the address we emailed you. Use the labelled box and tracked carrier.';
                }
                break;
            case 'in_custody':
                if ($loan && $loan->status === 'overdue') {
                    return 'Open the loan page and pay the past-due installment now to avoid default.';
                }
                if ($loan && $loan->status === 'active') {
                    return 'Open the loan page and pay the next installment before the due date.';
                }
                break;
        }
        return 'Open the asset to see what to do next.';
    }

    /**
     * @return array<int,array{title: string, desc: string}>
     */
    protected static function nextStepsPreview(int $currentStep): array
    {
        $all = [
            1 => ['title' => 'Submitted',   'desc' => 'You register the asset with photos and serial number.'],
            2 => ['title' => 'Evaluating',  'desc' => 'Online + offline evaluators verify authenticity and pricing against market data.'],
            3 => ['title' => 'Decision',    'desc' => 'You\'ll see an appraisal range and decide if you want to proceed.'],
            4 => ['title' => 'Custody',     'desc' => 'We\'ll send instructions to ship the asset to our insured São Paulo vault.'],
            5 => ['title' => 'Loan active', 'desc' => 'USDC disbursed to your wallet. You start paying installments.'],
            6 => ['title' => 'Released',    'desc' => 'Once you repay, we ship the asset back. Or re-loan instantly.'],
        ];

        // Return only steps AFTER the current one
        return array_filter($all, fn ($_, $k) => $k > $currentStep, ARRAY_FILTER_USE_BOTH);
    }
}
