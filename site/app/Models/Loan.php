<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Loan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'user_id',
        'asset_id',
        'approved_by',
        'status',
        'asset_value',
        'ltv_percent',
        'principal',
        'interest_rate',
        'origination_fee_percent',
        'origination_fee',
        'liquidation_fee_percent',
        'term_months',
        'start_date',
        'due_date',
        'total_repaid',
        'outstanding_balance',
        'currency',
        'escrow_address',
        'solana_loan_id',
        'disbursement_tx_hash',
        'confirm_custody_tx',
        'repayment_tx_hash',
        'approved_at',
        'disbursed_at',
        'repaid_at',
        'defaulted_at',
        'admin_notes',
    ];

    protected $casts = [
        'asset_value' => 'decimal:2',
        'ltv_percent' => 'decimal:2',
        'principal' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'origination_fee_percent' => 'decimal:2',
        'origination_fee' => 'decimal:2',
        'liquidation_fee_percent' => 'decimal:2',
        'total_repaid' => 'decimal:2',
        'outstanding_balance' => 'decimal:2',
        'start_date' => 'date',
        'due_date' => 'date',
        'approved_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'repaid_at' => 'datetime',
        'defaulted_at' => 'datetime',
    ];

    const STATUSES = [
        'pending_custody' => 'Pending Custody',
        'active' => 'Active',
        'overdue' => 'Overdue',
        'defaulted' => 'Defaulted',
        'repaid' => 'Repaid',
    ];

    const STATUS_COLORS = [
        'pending_custody' => 'warning',
        'active' => 'success',
        'overdue' => 'danger',
        'defaulted' => 'dark',
        'repaid' => 'info',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function payments()
    {
        return $this->hasMany(LoanPayment::class);
    }

    /**
     * Lazily produce a base58 32-byte pubkey for this loan.
     *
     * The Solana bridge accepts any valid base58 32-byte string while it's
     * in placeholder mode (it derives `loan_config` and `trdc_state` PDAs
     * server-side and doesn't verify the loan exists on-chain). So as long
     * as we hand the same string back for the same loan, the bridge sees
     * a stable identifier and the Laravel side can persist the txSignature
     * keyed to it.
     *
     * Determinism via `sha256(loan->id)` → 32 bytes → base58 encode means:
     *   - Same loan → same pubkey, every call.
     *   - Different loans → different pubkeys (no PDA collision in the
     *     bridge's `commonAccounts` derivation).
     *   - No randomness, so calling this method twice without persisting
     *     in between still yields the same value.
     *
     * Returns the persisted column value when present (the post-atomic
     * world: real on-chain PDA), otherwise the deterministic fake. Callers
     * that need to persist should `$loan->update(['solana_loan_id' => ...])`
     * with this same value before passing it to the bridge — the existing
     * `\App\Services\SolanaBridgeIntegration::ensureSolanaLoanId()` helper
     * does this idempotently. This accessor stays read-only.
     */
    public function getSolanaLoanIdAttribute(): string
    {
        $stored = $this->attributes['solana_loan_id'] ?? null;
        if (is_string($stored) && $stored !== '') {
            return $stored;
        }
        return self::deriveDeterministicSolanaLoanId((int) $this->id);
    }

    /**
     * Pure helper — exposed as a static so seeders / tests can produce the
     * same value without instantiating a Loan. Computes 32 bytes of sha256
     * over `loan-{id}` and base58-encodes via the in-tree
     * App\Support\Base58 helper. The `loan-` prefix avoids collisions
     * with any other model that does the same trick on raw IDs.
     */
    public static function deriveDeterministicSolanaLoanId(int $loanId): string
    {
        return (new \App\Support\Base58())->encode(hash('sha256', 'loan-' . $loanId, true));
    }

    // (Legacy duplicated base58 implementation lives below; kept as a
    // private fallback in case the autoload graph for App\Support\Base58
    // misbehaves at boot. Prefer the helper above for new call sites.)
    private static function base58Encode(string $bytes): string
    {
        $alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        $leadingZeros = 0;
        $len = strlen($bytes);
        while ($leadingZeros < $len && $bytes[$leadingZeros] === "\x00") {
            $leadingZeros++;
        }

        $nums = array_values(unpack('C*', $bytes) ?: []);

        $output = '';
        while (!empty($nums)) {
            $newNums = [];
            $remainder = 0;
            $started = false;
            foreach ($nums as $byte) {
                $value = $remainder * 256 + $byte;
                $quotient = intdiv($value, 58);
                $remainder = $value % 58;
                if ($started || $quotient !== 0) {
                    $newNums[] = $quotient;
                    $started = true;
                }
            }
            $output = $alphabet[$remainder] . $output;
            $nums = $newNums;
        }

        return str_repeat('1', $leadingZeros) . $output;
    }

    // Accessors
    public function getStatusLabelAttribute()
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getStatusColorAttribute()
    {
        return self::STATUS_COLORS[$this->status] ?? 'secondary';
    }

    public function getProgressPercentAttribute()
    {
        if ($this->principal <= 0) return 0;
        return min(100, round(($this->total_repaid / $this->principal) * 100, 1));
    }

    public function getCurrencyPrefixAttribute(): string
    {
        return $this->currency === 'BRZ' ? 'R$ ' : '$';
    }

    public function formatAmount($amount): string
    {
        $locale = $this->currency === 'BRZ' ? 'pt-BR' : 'en-US';
        $formatter = new \NumberFormatter($locale, \NumberFormatter::DECIMAL);
        $formatter->setAttribute(\NumberFormatter::MIN_FRACTION_DIGITS, 2);
        $formatter->setAttribute(\NumberFormatter::MAX_FRACTION_DIGITS, 2);
        return $this->currency_prefix . $formatter->format((float) $amount);
    }

    public function explorerUrl(string $type, ?string $value): ?string
    {
        if (empty($value)) return null;
        $base = rtrim(config('garantifi.explorer_url', 'https://explorer.solana.com'), '/');
        $network = config('garantifi.network', 'devnet');
        $cluster = $network !== 'mainnet' ? "?cluster={$network}" : '';
        return match ($type) {
            'tx' => "{$base}/tx/{$value}{$cluster}",
            'address' => "{$base}/address/{$value}{$cluster}",
            default => null,
        };
    }

    // Code generator
    public static function generateCode()
    {
        $year = date('Y');
        $last = self::whereYear('created_at', $year)->count() + 1;
        return sprintf('GF-%s-%05d', $year, $last);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue');
    }

    public function scopePendingCustody($query)
    {
        return $query->where('status', 'pending_custody');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRepaid($query)
    {
        return $query->where('status', 'repaid');
    }

    /**
     * An asset is "re-loan eligible" if:
     *  - it has a previous loan in status=repaid
     *  - the asset has appraised_value (came back from evaluation pipeline)
     *  - no currently active/overdue loan against it
     *  - last appraisal happened within the last 6 months (configurable)
     */
    public static function reloanEligible(Asset $asset): bool
    {
        if (!$asset->appraised_value || !$asset->appraisal_date) return false;

        $maxAgeDays = (int) config('garantifi.reloan.max_appraisal_age_days', 180);
        if ($asset->appraisal_date->diffInDays(now()) > $maxAgeDays) return false;

        $hasOpen = $asset->loans()
            ->whereIn('status', ['pending_custody', 'active', 'overdue'])
            ->exists();
        if ($hasOpen) return false;

        return $asset->loans()->where('status', 'repaid')->exists();
    }

    /**
     * Activates a loan after admin custody approval: sets status=active,
     * generates installments, fills date fields, marks asset as in_custody.
     * Used by AdminController::approveCustody.
     */
    public function activateAsApproved(?int $approverId = null): void
    {
        $startDate = \Carbon\Carbon::today();
        $dueDate = $startDate->copy()->addMonths((int) $this->term_months);

        $this->update([
            'status' => 'active',
            'approved_by' => $approverId,
            'approved_at' => now(),
            'disbursed_at' => now(),
            'start_date' => $startDate,
            'due_date' => $dueDate,
            'disbursement_tx_hash' => \Illuminate\Support\Str::random(87),
        ]);

        if ($this->asset->custody_status !== 'in_custody') {
            $this->asset->update([
                'custody_status' => 'in_custody',
                'custody_received_at' => $this->asset->custody_received_at ?: now(),
                'custody_location' => $this->asset->custody_location ?: 'Vaulx Vault #001 — São Paulo, SP',
            ]);
        }

        $this->generateInstallments();
    }

    public function generateInstallments(): void
    {
        $principal = (float) $this->principal;
        $annualBps = (int) round(((float) $this->interest_rate) * 100);
        $months = (int) $this->term_months;
        $schedule = \App\Services\InterestCalculator::linearSchedule($principal, $annualBps, $months);
        $startDate = \Carbon\Carbon::parse($this->start_date);

        foreach ($schedule as $row) {
            LoanPayment::create([
                'loan_id' => $this->id,
                'installment_number' => $row['number'],
                'amount_due' => $row['amount'],
                'principal_portion' => $row['principal'],
                'interest_portion' => $row['interest'],
                'due_date' => $startDate->copy()->addMonths($row['number']),
            ]);
        }
    }
}
