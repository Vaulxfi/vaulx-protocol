<?php

namespace App\Console\Commands;

use App\Models\CronRun;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\OnchainEvent;
use App\Notifications\LoanOverdue;
use Illuminate\Console\Command;

class MarkOverdueCommand extends Command
{
    protected $signature = 'garantifi:mark-overdue {--dry : Apenas simula, não altera o banco}';

    protected $description = 'Varre empréstimos ACTIVE com due_date < hoje e marca como OVERDUE (bot wallet, sem acesso ao vault)';

    public function handle(): int
    {
        $scanned = 0;
        $affected = 0;
        $notes = [];

        $loans = Loan::query()
            ->where('status', 'active')
            ->whereDate('due_date', '<', today())
            ->get();

        $scanned = $loans->count();
        $dry = (bool) $this->option('dry');

        foreach ($loans as $loan) {
            if (!$dry) {
                $loan->update(['status' => 'overdue']);
                OnchainEvent::create([
                    'event_name' => 'MarkOverdue',
                    'signature' => null,
                    'program_id' => config('garantifi.programs.loan') ?: 'BOT',
                    'payload' => [
                        'loan_code' => $loan->code,
                        'user_id' => $loan->user_id,
                        'note' => 'Bot cron: expired',
                    ],
                    'occurred_at' => now(),
                ]);
                try {
                    $loan->user->notify(new LoanOverdue($loan));
                } catch (\Throwable $e) {
                    \Log::warning('LoanOverdue notification failed', ['loan_id' => $loan->id, 'message' => $e->getMessage()]);
                }
            }
            $affected++;
            $notes[] = $loan->code;
        }

        $paymentsAffected = LoanPayment::query()
            ->whereIn('status', ['pending'])
            ->whereDate('due_date', '<', today())
            ->when(!$dry, fn ($q) => $q->update(['status' => 'overdue']));

        CronRun::create([
            'name' => 'mark_overdue',
            'scanned' => $scanned,
            'affected' => $affected,
            'status' => 'ok',
            'notes' => $notes ? implode(', ', $notes) : null,
            'ran_at' => now(),
        ]);

        $this->info("Scanned {$scanned} active loans; marked {$affected} as overdue" . ($dry ? ' (dry run)' : ''));

        return self::SUCCESS;
    }
}
