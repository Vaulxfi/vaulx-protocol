<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Evaluation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SuspiciousAlignmentDetected extends Notification
{
    use Queueable;

    public function __construct(public Evaluation $evaluation, public array $alert)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('🔴 Suspicious alignment detected — Vaulx')
            ->error()
            ->greeting("Hi {$notifiable->name},")
            ->line('The triangle validator detected a suspicious alignment pattern:')
            ->line('Both online and offline evaluators converged within 5%, but **both are more than 20% off** the market median.')
            ->line("Asset: {$this->evaluation->asset->brand} {$this->evaluation->asset->model}")
            ->line("Ref.: {$this->evaluation->asset->reference_number}")
            ->line('Please audit both reports manually before approving any downstream operation.')
            ->action('Review evaluation', route('admin.evaluators.index'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'evaluation_id' => $this->evaluation->id,
            'alert' => $this->alert,
            'event' => 'suspicious_alignment',
        ];
    }
}
