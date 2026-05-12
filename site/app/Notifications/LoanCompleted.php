<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanCompleted extends Notification
{
    use Queueable;

    public function __construct(public Loan $loan)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reloanUrl = route('borrower.reloan.show', $this->loan->asset);
        return (new MailMessage)
            ->subject("Loan {$this->loan->code} fully repaid — Vaulx")
            ->greeting("Hi {$notifiable->name},")
            ->line("Loan {$this->loan->code} is fully repaid. Your {$this->loan->asset->brand} {$this->loan->asset->model} is yours again.")
            ->line("**Total repaid:** {$this->loan->formatAmount($this->loan->total_repaid)}")
            ->line("Thank you for the trust. Whenever you need liquidity again, your asset is already evaluated — re-loans skip the queue and disburse in hours, not days.")
            ->action('Re-loan one-click', $reloanUrl)
            ->line('— The Vaulx team');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'loan_id' => $this->loan->id,
            'code' => $this->loan->code,
            'event' => 'loan_completed',
        ];
    }
}
