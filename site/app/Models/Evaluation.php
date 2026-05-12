<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Evaluation extends Model
{
    use HasFactory;

    const STATUS_PENDING_ONLINE = 'pending_online';
    const STATUS_PENDING_OWNER = 'pending_owner_decision';
    const STATUS_PENDING_OFFLINE = 'pending_offline';
    const STATUS_CONSOLIDATED = 'consolidated';
    const STATUS_ABORTED = 'aborted';

    const STATUSES = [
        self::STATUS_PENDING_ONLINE => 'Pending online',
        self::STATUS_PENDING_OWNER => 'Pending owner decision',
        self::STATUS_PENDING_OFFLINE => 'Pending offline',
        self::STATUS_CONSOLIDATED => 'Consolidated',
        self::STATUS_ABORTED => 'Aborted',
    ];

    protected $fillable = [
        'asset_id', 'market_snapshot_id', 'online_evaluator_id', 'offline_evaluator_id',
        'status', 'range_min', 'range_max', 'owner_decision', 'owner_decided_at',
        'final_value', 'alerts',
    ];

    protected $casts = [
        'range_min' => 'decimal:2',
        'range_max' => 'decimal:2',
        'final_value' => 'decimal:2',
        'owner_decision' => 'boolean',
        'owner_decided_at' => 'datetime',
        'alerts' => 'array',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function marketSnapshot(): BelongsTo
    {
        return $this->belongsTo(MarketSnapshot::class);
    }

    public function onlineEvaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'online_evaluator_id');
    }

    public function offlineEvaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'offline_evaluator_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(EvaluatorReport::class);
    }

    public function onlineReport(): HasOne
    {
        return $this->hasOne(EvaluatorReport::class)->where('layer', 'online');
    }

    public function offlineReport(): HasOne
    {
        return $this->hasOne(EvaluatorReport::class)->where('layer', 'offline');
    }

    public function statusLabel(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }
}
