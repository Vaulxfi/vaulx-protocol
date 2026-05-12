<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'installment_number',
        'amount_due',
        'principal_portion',
        'interest_portion',
        'amount_paid',
        'due_date',
        'paid_at',
        'status',
        'tx_hash',
    ];

    protected $casts = [
        'amount_due' => 'decimal:2',
        'principal_portion' => 'decimal:2',
        'interest_portion' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'date',
    ];

    const STATUSES = [
        'pending' => 'Pending',
        'paid' => 'Paid',
        'overdue' => 'Overdue',
        'partial' => 'Partial',
    ];

    // Relationships
    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    // Accessors
    public function getStatusLabelAttribute()
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function isOverdue()
    {
        return $this->status !== 'paid' && $this->due_date->isPast();
    }

    public function getRemainingAttribute()
    {
        return max(0, $this->amount_due - $this->amount_paid);
    }
}
