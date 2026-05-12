<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketConfig extends Model
{
    use HasFactory;

    protected $table = 'market_config';

    protected $fillable = ['brand', 'family', 'brl_factor', 'notes'];

    protected $casts = [
        'brl_factor' => 'decimal:4',
    ];

    public static function factorFor(string $brand, ?string $family = null): float
    {
        if ($family) {
            $exact = static::where('brand', $brand)->where('family', $family)->first();
            if ($exact) return (float) $exact->brl_factor;
        }
        $byBrand = static::where('brand', $brand)->whereNull('family')->first();
        return $byBrand ? (float) $byBrand->brl_factor : 1.0;
    }
}
