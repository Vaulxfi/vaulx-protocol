<?php

namespace App\Console\Commands;

use App\Models\OnchainEvent;
use App\Services\SolanaService;
use Illuminate\Console\Command;

class WatchOnchainEventsCommand extends Command
{
    protected $signature = 'garantifi:watch-events {--limit=20}';

    protected $description = 'Polling dos logs do Loan Program. Persiste novos eventos em onchain_events';

    public function handle(SolanaService $solana): int
    {
        $programId = config('garantifi.programs.loan');
        if (empty($programId)) {
            $this->warn('GF_LOAN_PROGRAM_ID não configurado. Pulando.');
            return self::SUCCESS;
        }

        $signatures = $solana->getSignaturesForAddress($programId, (int) $this->option('limit'));
        $new = 0;
        foreach ($signatures as $item) {
            $sig = $item['signature'] ?? null;
            if (!$sig || OnchainEvent::where('signature', $sig)->exists()) continue;

            OnchainEvent::create([
                'event_name' => 'Signature',
                'signature' => $sig,
                'slot' => $item['slot'] ?? null,
                'program_id' => $programId,
                'payload' => $item,
                'occurred_at' => isset($item['blockTime']) ? now()->setTimestamp($item['blockTime']) : now(),
            ]);
            $new++;
        }

        $this->info("Capturadas {$new} novas assinaturas do programa {$programId}");
        return self::SUCCESS;
    }
}
