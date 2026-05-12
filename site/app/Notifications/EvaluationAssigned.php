<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Evaluation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EvaluationAssigned extends Notification
{
    use Queueable;

    public function __construct(public Evaluation $evaluation, public string $layer)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('evaluator.dashboard');
        return (new MailMessage)
            ->subject(ucfirst($this->layer) . ' evaluation assigned — Vaulx')
            ->greeting("Hi {$notifiable->name},")
            ->line("You have been assigned the {$this->layer} report for asset {$this->evaluation->asset->brand} {$this->evaluation->asset->model}.")
            ->action('Open report', $url);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'evaluation_id' => $this->evaluation->id,
            'layer' => $this->layer,
            'event' => 'evaluation_assigned',
        ];
    }
}
