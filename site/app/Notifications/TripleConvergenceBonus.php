<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Evaluation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TripleConvergenceBonus extends Notification
{
    use Queueable;

    public function __construct(public Evaluation $evaluation, public int $bonusPoints = 5)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $asset = $this->evaluation->asset;

        return (new MailMessage)
            ->subject("✦ +{$this->bonusPoints} reputation — triple convergence — Vaulx")
            ->greeting("Hi {$notifiable->name},")
            ->line("Your evaluation of {$asset->brand} {$asset->model} converged with the other layer **and** the market within the green band.")
            ->line("This is a triple convergence — a high-trust signal — and earns you **+{$this->bonusPoints} reputation points**.")
            ->line('Your tier may have advanced. Higher tiers unlock priority on incoming evaluations.')
            ->action('View your evaluator score', route('evaluator.dashboard'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'evaluation_id' => $this->evaluation->id,
            'asset_id' => $this->evaluation->asset_id,
            'bonus_points' => $this->bonusPoints,
            'event' => 'triple_convergence_bonus',
        ];
    }
}
