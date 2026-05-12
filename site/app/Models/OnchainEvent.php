<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnchainEvent extends Model
{
    use HasFactory;

    protected $fillable = ['event_name', 'signature', 'slot', 'program_id', 'payload', 'occurred_at'];

    protected $casts = [
        'payload' => 'array',
        'slot' => 'integer',
        'occurred_at' => 'datetime',
    ];

    public $timestamps = false;
}
