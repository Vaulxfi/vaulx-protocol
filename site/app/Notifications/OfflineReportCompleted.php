<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Evaluation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OfflineReportCompleted extends Notification
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
        $asset = $this->evaluation->asset;
        $finalValue = $this->evaluation->final_value
            ? '$' . number_format((float) $this->evaluation->final_value, 2)
            : 'pending consolidation';

        $isOwner = $notifiable->id === $asset->user_id;
        $action = $isOwner
            ? ['View final valuation', route('borrower.assets.index')]
            : ['Review evaluation', route('admin.evaluators.index')];

        return (new MailMessage)
            ->subject('Evaluation consolidated — Vaulx')
            ->greeting("Hi {$notifiable->name},")
            ->line("The triangle evaluation for {$asset->brand} {$asset->model} is now consolidated.")
            ->line("Reference: {$asset->reference_number}")
            ->line("Final value: {$finalValue}")
            ->action($action[0], $action[1])
            ->line('All three layers (online, offline, market) have been recorded.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'evaluation_id' => $this->evaluation->id,
            'asset_id' => $this->evaluation->asset_id,
            'final_value' => $this->evaluation->final_value,
            'event' => 'offline_report_completed',
        ];
    }
}
