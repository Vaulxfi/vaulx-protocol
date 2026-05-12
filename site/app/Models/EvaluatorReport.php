<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EvaluatorReport extends Model
{
    use HasFactory;

    const GRADES = [
        'mint' => ['label' => 'MINT', 'pct' => 100],
        'ex' => ['label' => 'EX', 'pct' => 88],
        'vg' => ['label' => 'VG', 'pct' => 72],
        'g' => ['label' => 'G', 'pct' => 55],
        'f' => ['label' => 'F', 'pct' => 35],
    ];

    const SET_BONUS = [
        'box' => 0.06,
        'papers' => 0.12,
        'full' => 0.18,
    ];

    protected $fillable = [
        'evaluation_id', 'evaluator_id', 'layer', 'value_usd', 'grade',
        'has_box', 'has_papers', 'visual_condition', 'replica_signs',
        'caliber', 'serial_match', 'movement_condition', 'authenticity',
        'timing_rate', 'scores', 'submitted_at',
    ];

    protected $casts = [
        'value_usd' => 'decimal:2',
        'timing_rate' => 'decimal:2',
        'has_box' => 'boolean',
        'has_papers' => 'boolean',
        'replica_signs' => 'boolean',
        'serial_match' => 'boolean',
        'visual_condition' => 'array',
        'movement_condition' => 'array',
        'scores' => 'array',
        'submitted_at' => 'datetime',
    ];

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function setBonusPercent(): float
    {
        if ($this->has_box && $this->has_papers) return self::SET_BONUS['full'];
        if ($this->has_papers) return self::SET_BONUS['papers'];
        if ($this->has_box) return self::SET_BONUS['box'];
        return 0.0;
    }
}
