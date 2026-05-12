<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Evaluation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OnlineReportCompleted extends Notification
{
    use Queueable;

    public function __construct(public Evaluation $evaluation)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('evaluation.range', $this->evaluation->asset);
        return (new MailMessage)
            ->subject('Your online report is ready — Vaulx')
            ->greeting("Hi {$notifiable->name},")
            ->line("The online evaluation for your {$this->evaluation->asset->brand} {$this->evaluation->asset->model} is complete.")
            ->line('You can now see a preliminary valuation range and decide whether to proceed to the physical step.')
            ->action('View range & decide', $url)
            ->line('You have 48 hours to decide.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'evaluation_id' => $this->evaluation->id,
            'asset_id' => $this->evaluation->asset_id,
            'event' => 'online_report_completed',
        ];
    }
}
