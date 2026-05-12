<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Asset;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AssetEvaluated extends Notification
{
    use Queueable;

    public function __construct(public Asset $asset)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $loanUrl = route('borrower.loan.request');
        return (new MailMessage)
            ->subject('Your asset has been evaluated — Vaulx')
            ->greeting("Hi {$notifiable->name},")
            ->line("Great news! Your {$this->asset->brand} {$this->asset->model} was just evaluated.")
            ->line("**Appraised value:** \$" . number_format((float) $this->asset->appraised_value, 2))
            ->line("You can now request a loan using this asset as collateral.")
            ->action('Request Loan', $loanUrl)
            ->line('If you have any questions, reply to this email.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'asset_id' => $this->asset->id,
            'brand' => $this->asset->brand,
            'model' => $this->asset->model,
            'appraised_value' => $this->asset->appraised_value,
            'event' => 'asset_evaluated',
        ];
    }
}
