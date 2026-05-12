<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('garantifi:mark-overdue')
            ->hourly()
            ->withoutOverlapping()
            ->runInBackground();

        $schedule->command('garantifi:capture-brz-rate')
            ->everyFiveMinutes()
            ->withoutOverlapping();

        $schedule->command('garantifi:watch-events')
            ->everyMinute()
            ->withoutOverlapping();

        $schedule->command('garantifi:reengagement')
            ->dailyAt('10:00')
            ->withoutOverlapping();

        $schedule->command('garantifi:capture-market-snapshot')
            ->everyFifteenMinutes()
            ->withoutOverlapping();
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
