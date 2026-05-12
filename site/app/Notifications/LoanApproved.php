<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanApproved extends Notification
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
        $url = route('borrower.loan.show', $this->loan);
        return (new MailMessage)
            ->subject("Loan {$this->loan->code} approved — Vaulx")
            ->greeting("Hi {$notifiable->name},")
            ->line("Your loan {$this->loan->code} has been approved and activated.")
            ->line("**Principal:** {$this->loan->formatAmount($this->loan->principal)}")
            ->line("**Due date:** " . optional($this->loan->due_date)->format(config('app.date_format')))
            ->action('View Loan', $url);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'loan_id' => $this->loan->id,
            'code' => $this->loan->code,
            'principal' => $this->loan->principal,
            'event' => 'loan_approved',
        ];
    }
}
