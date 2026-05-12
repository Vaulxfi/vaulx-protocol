<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id', 'reference_number', 'median_usd', 'min_usd', 'max_usd',
        'listings_count', 'trend', 'brl_factor', 'sources', 'raw', 'captured_at',
    ];

    protected $casts = [
        'median_usd' => 'decimal:2',
        'min_usd' => 'decimal:2',
        'max_usd' => 'decimal:2',
        'brl_factor' => 'decimal:4',
        'listings_count' => 'integer',
        'sources' => 'array',
        'raw' => 'array',
        'captured_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function isInsufficient(): bool
    {
        return $this->trend === 'insufficient' || $this->listings_count < (int) config('garantifi.market.min_listings', 5);
    }
}
