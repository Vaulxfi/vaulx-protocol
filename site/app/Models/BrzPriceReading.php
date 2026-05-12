<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BrzPriceReading extends Model
{
    use HasFactory;

    protected $fillable = ['brz_usd', 'usd_brl', 'brz_brl', 'depeg_pct', 'tier', 'read_at'];

    protected $casts = [
        'brz_usd' => 'decimal:6',
        'usd_brl' => 'decimal:4',
        'brz_brl' => 'decimal:6',
        'depeg_pct' => 'decimal:4',
        'read_at' => 'datetime',
    ];

    public $timestamps = false;
}
