<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanOverdue extends Notification
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
            ->subject("⚠ Loan {$this->loan->code} is overdue — Vaulx")
            ->error()
            ->greeting("Hi {$notifiable->name},")
            ->line("Your loan {$this->loan->code} has passed its due date.")
            ->line("A 1.5% monthly late fee is now accruing on the principal.")
            ->line("Please make a payment as soon as possible to avoid default liquidation.")
            ->action('Pay now', $url);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'loan_id' => $this->loan->id,
            'code' => $this->loan->code,
            'event' => 'loan_overdue',
        ];
    }
}
