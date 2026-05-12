<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Evaluation;
use App\Models\MarketSnapshot;
use App\Services\MarketPriceService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CaptureMarketSnapshotCommand extends Command
{
    protected $signature = 'garantifi:capture-market-snapshot {--max-age-hours=24 : Refresh snapshots older than this}';

    protected $description = 'Captures market snapshots for evaluations missing one or with stale data';

    public function handle(MarketPriceService $market): int
    {
        $maxAgeHours = (int) $this->option('max-age-hours');
        $cutoff = Carbon::now()->subHours($maxAgeHours);

        // Targets: evaluations still gated on market data, OR evaluations whose snapshot is stale.
        $targets = Evaluation::query()
            ->with('asset', 'marketSnapshot')
            ->whereIn('status', [
                Evaluation::STATUS_PENDING_ONLINE,
                Evaluation::STATUS_PENDING_OWNER,
                Evaluation::STATUS_PENDING_OFFLINE,
            ])
            ->where(function ($q) use ($cutoff) {
                $q->whereNull('market_snapshot_id')
                  ->orWhereHas('marketSnapshot', fn ($s) => $s->where('captured_at', '<', $cutoff));
            })
            ->get();

        $captured = 0;
        $skipped = 0;

        foreach ($targets as $evaluation) {
            $asset = $evaluation->asset;
            if (!$asset || empty($asset->reference_number)) {
                $skipped++;
                continue;
            }

            $snapshot = $market->snapshotForAsset($asset);
            if (!$snapshot instanceof MarketSnapshot) {
                $skipped++;
                continue;
            }

            $evaluation->update(['market_snapshot_id' => $snapshot->id]);
            $captured++;

            $this->line(sprintf(
                '  ✓ #%d  %s %s  ref=%s  median=$%s  listings=%d',
                $evaluation->id,
                $asset->brand,
                $asset->model,
                $asset->reference_number,
                number_format((float) $snapshot->median_usd, 0),
                (int) $snapshot->listings_count,
            ));
        }

        $this->info("Captured {$captured} snapshots, skipped {$skipped}.");
        return self::SUCCESS;
    }
}
