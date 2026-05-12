<?php

namespace App\Console\Commands;

use App\Models\BrzPriceReading;
use App\Services\CurrencyService;
use Illuminate\Console\Command;

class CaptureBrzRateCommand extends Command
{
    protected $signature = 'garantifi:capture-brz-rate';

    protected $description = 'Captura preço BRZ (Jupiter) + USD/BRL (AwesomeAPI), persiste leitura e classifica depeg';

    public function handle(CurrencyService $currency): int
    {
        $currency->forceRefresh();
        $snap = $currency->snapshot();
        $depeg = (float) $snap['depeg_pct'];

        $tier = 'normal';
        if ($depeg <= -5) $tier = 'convert';
        elseif ($depeg <= -3) $tier = 'paused';
        elseif ($depeg <= -1) $tier = 'alert';

        BrzPriceReading::create([
            'brz_usd' => $snap['brz_usd'],
            'usd_brl' => $snap['usd_brl'],
            'brz_brl' => $snap['brz_brl'],
            'depeg_pct' => $depeg,
            'tier' => $tier,
            'read_at' => now(),
        ]);

        $this->info("BRZ={$snap['brz_usd']} USD/BRL={$snap['usd_brl']} depeg={$depeg}% tier={$tier}");
        return self::SUCCESS;
    }
}
