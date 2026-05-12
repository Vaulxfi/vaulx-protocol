<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CronRun extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'scanned', 'affected', 'status', 'notes', 'ran_at'];

    protected $casts = ['ran_at' => 'datetime'];

    public $timestamps = false;
}
