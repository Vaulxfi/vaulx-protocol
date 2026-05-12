<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluatorScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'layer', 'current_score', 'tier', 'total_reports', 'history',
    ];

    protected $casts = [
        'current_score' => 'decimal:2',
        'tier' => 'integer',
        'total_reports' => 'integer',
        'history' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tierColor(): string
    {
        return match ($this->tier) {
            4 => 'success',
            3 => 'info',
            2 => 'warning',
            default => 'secondary',
        };
    }

    public static function computeTier(float $score): int
    {
        $tiers = config('garantifi.scoring.tiers', [1 => 0, 2 => 60, 3 => 75, 4 => 90]);
        $tier = 1;
        foreach ($tiers as $t => $min) {
            if ($score >= $min) $tier = $t;
        }
        return $tier;
    }
}
