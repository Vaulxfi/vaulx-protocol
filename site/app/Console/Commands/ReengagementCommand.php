<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\CronRun;
use App\Models\Loan;
use App\Notifications\ReengagementOffer;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ReengagementCommand extends Command
{
    protected $signature = 'garantifi:reengagement {--dry : Apenas simula, não envia}';

    protected $description = 'Sends ReengagementOffer to borrowers whose last loan was repaid N days ago AND has no open loan';

    public function handle(): int
    {
        if (!config('garantifi.features.reengagement_drip')) {
            $this->info('Reengagement drip disabled (GF_REENGAGEMENT_ENABLED=false). Skipping.');
            return self::SUCCESS;
        }

        $days = (int) config('garantifi.reloan.reengagement_offer_days', 30);
        $dry = (bool) $this->option('dry');
        $targetDate = Carbon::today()->subDays($days);

        $loans = Loan::query()
            ->with('user', 'asset')
            ->where('status', 'repaid')
            ->whereDate('repaid_at', $targetDate)
            ->get();

        $sent = 0;
        $skipped = 0;

        foreach ($loans as $loan) {
            if (!$loan->user || !$loan->asset || !$loan->asset->appraised_value) {
                $skipped++;
                continue;
            }

            $hasOpen = $loan->user->loans()
                ->whereIn('status', ['pending_custody', 'active', 'overdue'])
                ->exists();
            if ($hasOpen) {
                $skipped++;
                continue;
            }

            if (!$dry) {
                try {
                    $loan->user->notify(new ReengagementOffer($loan->asset, $loan));
                    $sent++;
                } catch (\Throwable $e) {
                    \Log::warning('ReengagementOffer failed', [
                        'loan_id' => $loan->id,
                        'message' => $e->getMessage(),
                    ]);
                    $skipped++;
                }
            } else {
                $sent++;
            }
        }

        CronRun::create([
            'name' => 'reengagement',
            'scanned' => $loans->count(),
            'affected' => $sent,
            'status' => 'ok',
            'notes' => $skipped > 0 ? "skipped {$skipped} (open loans or missing data)" : null,
            'ran_at' => now(),
        ]);

        $this->info("Scanned {$loans->count()} loans repaid {$days}d ago; sent {$sent} reengagement emails" . ($dry ? ' (dry)' : '') . ($skipped ? "; skipped {$skipped}" : ''));
        return self::SUCCESS;
    }
}
