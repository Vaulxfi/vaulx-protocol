<?php

declare(strict_types=1);

namespace App\Services;

class InterestCalculator
{
    const SECONDS_PER_YEAR = 31_536_000;
    const SECONDS_PER_MONTH = 2_592_000;

    public static function simpleInterest(float $principal, int $annualBps, int $elapsedSeconds): float
    {
        if ($principal <= 0 || $annualBps <= 0 || $elapsedSeconds <= 0) {
            return 0.0;
        }
        $num = $principal * $annualBps * $elapsedSeconds;
        return round($num / (10000 * self::SECONDS_PER_YEAR), 2);
    }

    public static function interestForMonths(float $principal, int $annualBps, int $months): float
    {
        return self::simpleInterest($principal, $annualBps, $months * self::SECONDS_PER_MONTH);
    }

    public static function lateFee(float $principal, int $monthlyBps, int $overdueSeconds): float
    {
        if ($principal <= 0 || $monthlyBps <= 0 || $overdueSeconds <= 0) {
            return 0.0;
        }
        $months = max(1, (int) ceil($overdueSeconds / self::SECONDS_PER_MONTH));
        return round(($principal * $monthlyBps * $months) / 10000, 2);
    }

    public static function totalDue(float $principal, int $annualBps, int $months, int $overdueSeconds = 0, int $lateMonthlyBps = 0): array
    {
        $interest = self::interestForMonths($principal, $annualBps, $months);
        $lateFee = self::lateFee($principal, $lateMonthlyBps, $overdueSeconds);
        return [
            'principal' => round($principal, 2),
            'interest' => $interest,
            'late_fee' => $lateFee,
            'total' => round($principal + $interest + $lateFee, 2),
        ];
    }

    public static function linearSchedule(float $principal, int $annualBps, int $months): array
    {
        if ($principal <= 0 || $months <= 0) {
            return [];
        }
        $monthlyInterest = round(($principal * $annualBps) / 10000 / 12, 2);
        $principalPortion = round($principal / $months, 2);

        $schedule = [];
        $runningPrincipalPaid = 0.0;

        for ($i = 1; $i <= $months; $i++) {
            $isLast = ($i === $months);
            $currentPrincipal = $isLast ? round($principal - $runningPrincipalPaid, 2) : $principalPortion;
            $runningPrincipalPaid += $currentPrincipal;
            $balanceAfter = max(0, round($principal - $runningPrincipalPaid, 2));
            $amountDue = round($currentPrincipal + $monthlyInterest, 2);

            $schedule[] = [
                'number' => $i,
                'principal' => $currentPrincipal,
                'interest' => $monthlyInterest,
                'amount' => $amountDue,
                'balance_after' => $balanceAfter,
            ];
        }

        return $schedule;
    }
}
