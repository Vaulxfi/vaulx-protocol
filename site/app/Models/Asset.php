<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category',
        'brand',
        'model',
        'reference_number',
        'serial_number',
        'description',
        'year',
        'condition',
        'estimated_value',
        'appraised_value',
        'appraiser',
        'appraisal_date',
        'custody_status',
        'custody_location',
        'custody_received_at',
        'nft_mint_address',
        'metadata_uri',
        'mint_tx_hash',
        'photo_urls',
        'video_url',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'appraised_value' => 'decimal:2',
        'appraisal_date' => 'date',
        'custody_received_at' => 'datetime',
        'photo_urls' => 'array',
    ];

    const CATEGORIES = [
        'watch' => 'Watch',
        'jewelry' => 'Jewelry',
        'art' => 'Art',
        'vehicle' => 'Vehicle',
    ];

    const CUSTODY_STATUSES = [
        'pending_evaluation' => 'Pending Evaluation',
        'evaluated' => 'Evaluated',
        'with_owner' => 'With Owner',
        'in_transit' => 'In Transit',
        'in_custody' => 'In Custody',
        'released' => 'Released',
    ];

    const CUSTODY_STATUS_COLORS = [
        'pending_evaluation' => 'warning',
        'evaluated' => 'info',
        'with_owner' => 'secondary',
        'in_transit' => 'warning',
        'in_custody' => 'success',
        'released' => 'secondary',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function evaluation()
    {
        return $this->hasOne(Evaluation::class);
    }

    public function marketSnapshots()
    {
        return $this->hasMany(MarketSnapshot::class)->orderByDesc('captured_at');
    }

    public function activeLoan()
    {
        return $this->hasOne(Loan::class)->whereIn('status', ['pending_custody', 'active', 'overdue']);
    }

    // Helpers
    public function getCategoryLabelAttribute()
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }

    public function getCustodyStatusLabelAttribute()
    {
        return self::CUSTODY_STATUSES[$this->custody_status] ?? $this->custody_status;
    }

    public function getCustodyStatusColorAttribute()
    {
        return self::CUSTODY_STATUS_COLORS[$this->custody_status] ?? 'secondary';
    }

    public function getEffectiveValueAttribute()
    {
        return $this->appraised_value ?? $this->estimated_value;
    }

    public function isAvailableForLoan()
    {
        return $this->custody_status === 'evaluated'
            && is_null($this->activeLoan);
    }

    public function isPendingEvaluation()
    {
        return $this->custody_status === 'pending_evaluation';
    }

    public function isEvaluated()
    {
        return $this->custody_status === 'evaluated';
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

    // Scopes
    public function scopePendingEvaluation($query)
    {
        return $query->where('custody_status', 'pending_evaluation');
    }

    public function scopeEvaluated($query)
    {
        return $query->where('custody_status', 'evaluated');
    }
}
