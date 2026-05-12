<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Asset;
use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReengagementOffer extends Notification
{
    use Queueable;

    public function __construct(public Asset $asset, public Loan $previousLoan)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reloanUrl = route('borrower.reloan.show', $this->asset);
        $days = $this->previousLoan->repaid_at?->diffInDays(now()) ?? 30;

        return (new MailMessage)
            ->subject("Your {$this->asset->brand} {$this->asset->model} is ready for liquidity — Vaulx")
            ->greeting("Hi {$notifiable->name},")
            ->line("It's been {$days} days since you repaid {$this->previousLoan->code}.")
            ->line("Need liquidity again? Your {$this->asset->brand} {$this->asset->model} is already appraised at {$this->previousLoan->formatAmount($this->asset->appraised_value)} — re-loans take hours, not days.")
            ->line("Same wallet, same asset, one click.")
            ->action('Re-loan one-click', $reloanUrl)
            ->line('Reply if you have any questions. — The Vaulx team');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'asset_id' => $this->asset->id,
            'previous_loan_id' => $this->previousLoan->id,
            'event' => 'reengagement_offer',
        ];
    }
}
