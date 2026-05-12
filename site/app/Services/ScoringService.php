<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Evaluation;
use App\Models\EvaluatorReport;
use App\Models\EvaluatorScore;

class ScoringService
{
    /**
     * Compute M1 score (convergence between online and offline valuations).
     *
     * Input: the two value_usd values.
     * δ = |a - b| / median(a,b) × 100
     *
     * @return array{delta: float, score: int}
     */
    public static function computeM1(float $onlineValue, float $offlineValue): array
    {
        if ($onlineValue <= 0 || $offlineValue <= 0) {
            return ['delta' => 0.0, 'score' => 0];
        }
        $midpoint = ($onlineValue + $offlineValue) / 2;
        $delta = $midpoint > 0 ? abs($onlineValue - $offlineValue) / $midpoint * 100 : 0.0;
        $delta = round($delta, 2);

        $t = config('garantifi.scoring.m1_thresholds');
        $s = config('garantifi.scoring.m1_scores');

        $score = $s['poor'];
        if ($delta <= $t['excellent']) $score = $s['excellent'];
        elseif ($delta <= $t['good']) $score = $s['good'];
        elseif ($delta <= $t['fair']) $score = $s['fair'];

        return ['delta' => $delta, 'score' => (int) $score];
    }

    /**
     * Compute M6 score (anchoring to market median).
     *
     * @return array{delta: float, score: int, neutral: bool}
     */
    public static function computeM6(float $evaluatorValue, ?float $marketMedian, int $listingsCount = 0): array
    {
        $minListings = (int) config('garantifi.market.min_listings', 5);
        $neutralScore = (int) config('garantifi.scoring.m6_scores.neutral', 70);

        if (!$marketMedian || $marketMedian <= 0 || $listingsCount < $minListings) {
            return ['delta' => 0.0, 'score' => $neutralScore, 'neutral' => true];
        }

        $delta = abs($evaluatorValue - $marketMedian) / $marketMedian * 100;
        $delta = round($delta, 2);

        $t = config('garantifi.scoring.m6_thresholds');
        $s = config('garantifi.scoring.m6_scores');

        $score = $s['red'];
        if ($delta <= $t['green']) $score = $s['green'];
        elseif ($delta <= $t['yellow']) $score = $s['yellow'];
        elseif ($delta <= $t['orange']) $score = $s['orange'];

        return ['delta' => $delta, 'score' => (int) $score, 'neutral' => false];
    }

    /**
     * Combine weighted metric scores into a final 0–100 score.
     *
     * @param array<string, int> $metrics e.g. ['m1'=>100, 'm2'=>90, ...]
     */
    public static function weightedFinal(array $metrics): float
    {
        $weights = config('garantifi.scoring.weights');
        $totalWeight = 0;
        $weightedSum = 0;
        foreach ($weights as $key => $weight) {
            if (!isset($metrics[$key])) continue;
            $weightedSum += $metrics[$key] * $weight;
            $totalWeight += $weight;
        }
        return $totalWeight > 0 ? round($weightedSum / $totalWeight, 2) : 0.0;
    }

    /**
     * Consolidate an evaluation after both online & offline reports are in:
     * - Compute M1 (convergence), M6 (market anchoring) per evaluator
     * - Compute final weighted score (using placeholder 100 for M2..M5
     *   until those metrics have their own services; future-proofed)
     * - Detect triangle alerts
     * - Update EvaluatorScore records
     *
     * @return array{online_scores: array, offline_scores: array, alerts: array}
     */
    public static function consolidate(Evaluation $eval): array
    {
        $online = $eval->onlineReport;
        $offline = $eval->offlineReport;
        if (!$online || !$offline) {
            return ['online_scores' => [], 'offline_scores' => [], 'alerts' => []];
        }

        $snapshot = $eval->marketSnapshot;
        $median = $snapshot ? (float) $snapshot->median_usd : null;
        $listings = $snapshot ? (int) $snapshot->listings_count : 0;

        $m1 = self::computeM1((float) $online->value_usd, (float) $offline->value_usd);
        $m6Online = self::computeM6((float) $online->value_usd, $median, $listings);
        $m6Offline = self::computeM6((float) $offline->value_usd, $median, $listings);

        // Placeholder 100 for M2..M5 (other metrics depend on non-modelled data)
        $base = ['m2' => 100, 'm3' => 100, 'm4' => 100, 'm5' => 100];

        $onlineMetrics = array_merge($base, ['m1' => $m1['score'], 'm6' => $m6Online['score']]);
        $offlineMetrics = array_merge($base, ['m1' => $m1['score'], 'm6' => $m6Offline['score']]);

        // Triangle alerts + convergence bonus
        [$alerts, $bonus] = TriangleValidator::analyze($m1, $m6Online, $m6Offline, $median, $listings);
        if ($bonus > 0) {
            $onlineMetrics['m1'] = min(100, $onlineMetrics['m1'] + $bonus);
            $onlineMetrics['m6'] = min(100, $onlineMetrics['m6'] + $bonus);
            $offlineMetrics['m1'] = min(100, $offlineMetrics['m1'] + $bonus);
            $offlineMetrics['m6'] = min(100, $offlineMetrics['m6'] + $bonus);
        }

        $onlineFinal = self::weightedFinal($onlineMetrics);
        $offlineFinal = self::weightedFinal($offlineMetrics);

        $onlineMetrics['final'] = $onlineFinal;
        $offlineMetrics['final'] = $offlineFinal;
        $onlineMetrics['deltas'] = ['m1' => $m1['delta'], 'm6' => $m6Online['delta']];
        $offlineMetrics['deltas'] = ['m1' => $m1['delta'], 'm6' => $m6Offline['delta']];

        $online->update(['scores' => $onlineMetrics]);
        $offline->update(['scores' => $offlineMetrics]);

        self::updateEvaluatorScore($online->evaluator_id, 'online', $onlineFinal);
        self::updateEvaluatorScore($offline->evaluator_id, 'offline', $offlineFinal);

        $eval->update([
            'alerts' => $alerts,
            'status' => Evaluation::STATUS_CONSOLIDATED,
            'final_value' => round(((float) $online->value_usd + (float) $offline->value_usd) / 2, 2),
        ]);

        return [
            'online_scores' => $onlineMetrics,
            'offline_scores' => $offlineMetrics,
            'alerts' => $alerts,
        ];
    }

    public static function updateEvaluatorScore(int $userId, string $layer, float $newScore): EvaluatorScore
    {
        $record = EvaluatorScore::firstOrCreate(
            ['user_id' => $userId, 'layer' => $layer],
            ['current_score' => 0, 'tier' => 1, 'total_reports' => 0, 'history' => []]
        );
        $history = $record->history ?? [];
        $history[] = ['score' => $newScore, 'at' => now()->toIso8601String()];
        if (count($history) > 50) {
            $history = array_slice($history, -50);
        }
        $avg = array_sum(array_column($history, 'score')) / count($history);
        $record->update([
            'current_score' => round($avg, 2),
            'tier' => EvaluatorScore::computeTier($avg),
            'total_reports' => $record->total_reports + 1,
            'history' => $history,
        ]);
        return $record->refresh();
    }
}
