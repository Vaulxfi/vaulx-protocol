<?php

declare(strict_types=1);

namespace App\Services;

class TriangleValidator
{
    /**
     * Detect triangle alerts from M1 + M6 results.
     *
     * Alerts:
     *  - suspicious_alignment: online ↔ offline converge (δ_m1 ≤ 5%) but both > 20% off market
     *  - unilateral_deviation: one inside market, other outside
     *  - unstable_market: snapshot is insufficient (< min_listings)
     *  - triple_convergence: all three within tolerance → bonus +5pts
     *
     * @param array{delta: float, score: int} $m1
     * @param array{delta: float, score: int, neutral: bool} $m6Online
     * @param array{delta: float, score: int, neutral: bool} $m6Offline
     * @return array{0: array<int, array>, 1: int} [alerts, bonus]
     */
    public static function analyze(array $m1, array $m6Online, array $m6Offline, ?float $median, int $listings): array
    {
        $alerts = [];
        $bonus = 0;

        $suspThreshold = (float) config('garantifi.scoring.suspicious_alignment_threshold', 20);
        $bonusPts = (int) config('garantifi.scoring.convergence_bonus', 5);
        $greenTh = (float) config('garantifi.scoring.m6_thresholds.green', 10);
        $m1ExcTh = (float) config('garantifi.scoring.m1_thresholds.excellent', 5);

        // Unstable market
        if ($m6Online['neutral'] && $m6Offline['neutral']) {
            $alerts[] = [
                'type' => 'unstable_market',
                'severity' => 'info',
                'message' => "Market reference scarce (<{$listings} listings). M6 neutralized.",
            ];
            return [$alerts, 0];
        }

        // Suspicious alignment: evaluators match but both far from market
        $bothFar = $m6Online['delta'] > $suspThreshold && $m6Offline['delta'] > $suspThreshold;
        if ($m1['delta'] <= $m1ExcTh && $bothFar) {
            $alerts[] = [
                'type' => 'suspicious_alignment',
                'severity' => 'critical',
                'message' => 'Online and offline evaluators converge but both are >20% off market median. Possible collusion.',
                'm1_delta' => $m1['delta'],
                'm6_online_delta' => $m6Online['delta'],
                'm6_offline_delta' => $m6Offline['delta'],
            ];
            return [$alerts, 0]; // no bonus when suspicious
        }

        // Unilateral deviation
        $onlineIn = $m6Online['delta'] <= $suspThreshold;
        $offlineIn = $m6Offline['delta'] <= $suspThreshold;
        if ($onlineIn !== $offlineIn) {
            $alerts[] = [
                'type' => 'unilateral_deviation',
                'severity' => 'warning',
                'message' => sprintf(
                    '%s evaluator deviates from market.',
                    $onlineIn ? 'Offline' : 'Online'
                ),
                'm6_online_delta' => $m6Online['delta'],
                'm6_offline_delta' => $m6Offline['delta'],
            ];
        }

        // Triple convergence
        $tripleTight = $m1['delta'] <= $m1ExcTh
            && $m6Online['delta'] <= $greenTh
            && $m6Offline['delta'] <= $greenTh;
        if ($tripleTight) {
            $alerts[] = [
                'type' => 'triple_convergence',
                'severity' => 'success',
                'message' => 'All three sources converge (δ_m1 ≤ 5%, both δ_m6 ≤ 10%). Bonus awarded.',
                'bonus' => $bonusPts,
            ];
            $bonus = $bonusPts;
        }

        return [$alerts, $bonus];
    }
}
