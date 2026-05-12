<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'cpf_cnpj',
        'phone',
        'wallet_address',
        'solana_pubkey',
        'auth_provider',
        'address',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Roles
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isBorrower()
    {
        return $this->role === 'borrower';
    }

    public function isEvaluatorOnline(): bool
    {
        return $this->role === 'evaluator_online';
    }

    public function isEvaluatorOffline(): bool
    {
        return $this->role === 'evaluator_offline';
    }

    public function isEvaluator(): bool
    {
        return $this->isEvaluatorOnline() || $this->isEvaluatorOffline();
    }

    public function isSuperAdmin(): bool
    {
        return $this->isAdmin();
    }

    public function evaluatorScore(string $layer): ?EvaluatorScore
    {
        return $this->evaluatorScores()->where('layer', $layer)->first();
    }

    public function evaluatorScores()
    {
        return $this->hasMany(EvaluatorScore::class);
    }

    // Relationships
    public function assets()
    {
        return $this->hasMany(Asset::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function approvedLoans()
    {
        return $this->hasMany(Loan::class, 'approved_by');
    }
}
