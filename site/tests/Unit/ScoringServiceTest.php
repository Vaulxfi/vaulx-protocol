<?php

use App\Services\ScoringService;
use App\Services\TriangleValidator;

it('M1 scores excellent when delta <= 5%', function () {
    $result = ScoringService::computeM1(10000, 10300);
    expect($result['delta'])->toBeLessThan(5.0)
        ->and($result['score'])->toBe(100);
});

it('M1 scores good when delta ~7%', function () {
    $result = ScoringService::computeM1(10000, 10700);
    expect($result['score'])->toBe(80);
});

it('M1 scores fair when delta ~15%', function () {
    $result = ScoringService::computeM1(10000, 11600);
    expect($result['score'])->toBe(55);
});

it('M1 scores poor when delta > 20%', function () {
    $result = ScoringService::computeM1(10000, 13000);
    expect($result['score'])->toBe(20);
});

it('M1 returns zero score when either value is zero', function () {
    expect(ScoringService::computeM1(0, 10000)['score'])->toBe(0);
    expect(ScoringService::computeM1(10000, 0)['score'])->toBe(0);
});

it('M6 scores 100 when evaluator within 10% of market', function () {
    $result = ScoringService::computeM6(10500, 10000, 20);
    expect($result['score'])->toBe(100)
        ->and($result['neutral'])->toBeFalse();
});

it('M6 scores 75 when delta 10-20%', function () {
    $result = ScoringService::computeM6(11500, 10000, 20);
    expect($result['score'])->toBe(75);
});

it('M6 scores 45 when delta 20-30%', function () {
    $result = ScoringService::computeM6(12500, 10000, 20);
    expect($result['score'])->toBe(45);
});

it('M6 scores 10 when delta > 30%', function () {
    $result = ScoringService::computeM6(14000, 10000, 20);
    expect($result['score'])->toBe(10);
});

it('M6 returns neutral 70 when market has fewer than min listings', function () {
    $result = ScoringService::computeM6(10000, 10000, 3);
    expect($result['score'])->toBe(70)
        ->and($result['neutral'])->toBeTrue();
});

it('M6 returns neutral when median is missing', function () {
    $result = ScoringService::computeM6(10000, null, 20);
    expect($result['neutral'])->toBeTrue();
});

it('weightedFinal sums correctly with default weights', function () {
    $final = ScoringService::weightedFinal([
        'm1' => 100, 'm2' => 100, 'm3' => 100, 'm4' => 100, 'm5' => 100, 'm6' => 100,
    ]);
    expect($final)->toBe(100.00);
});

it('weightedFinal partial metrics still averages correctly', function () {
    $final = ScoringService::weightedFinal([
        'm1' => 80, 'm2' => 100, 'm3' => 100, 'm4' => 100, 'm5' => 100, 'm6' => 100,
    ]);
    // m1=80×30 + rest 100×(20+15+15+10+10) / 100 = 2400+7000 = 9400/100 = 94
    expect($final)->toBe(94.00);
});

it('TriangleValidator flags suspicious alignment when evaluators match but both far from market', function () {
    $m1 = ['delta' => 3.0, 'score' => 100];
    $m6Online = ['delta' => 25.0, 'score' => 45, 'neutral' => false];
    $m6Offline = ['delta' => 26.0, 'score' => 45, 'neutral' => false];
    [$alerts, $bonus] = TriangleValidator::analyze($m1, $m6Online, $m6Offline, 10000.0, 20);

    expect($bonus)->toBe(0);
    $types = array_column($alerts, 'type');
    expect($types)->toContain('suspicious_alignment');
});

it('TriangleValidator awards bonus on triple convergence', function () {
    $m1 = ['delta' => 2.0, 'score' => 100];
    $m6Online = ['delta' => 5.0, 'score' => 100, 'neutral' => false];
    $m6Offline = ['delta' => 7.0, 'score' => 100, 'neutral' => false];
    [$alerts, $bonus] = TriangleValidator::analyze($m1, $m6Online, $m6Offline, 10000.0, 20);

    expect($bonus)->toBe(5);
    $types = array_column($alerts, 'type');
    expect($types)->toContain('triple_convergence');
});

it('TriangleValidator flags unilateral deviation', function () {
    $m1 = ['delta' => 12.0, 'score' => 55];
    $m6Online = ['delta' => 5.0, 'score' => 100, 'neutral' => false];
    $m6Offline = ['delta' => 28.0, 'score' => 45, 'neutral' => false];
    [$alerts, $bonus] = TriangleValidator::analyze($m1, $m6Online, $m6Offline, 10000.0, 20);

    $types = array_column($alerts, 'type');
    expect($types)->toContain('unilateral_deviation');
});

it('TriangleValidator flags unstable market when listings insufficient', function () {
    $m1 = ['delta' => 3.0, 'score' => 100];
    $m6Online = ['delta' => 0.0, 'score' => 70, 'neutral' => true];
    $m6Offline = ['delta' => 0.0, 'score' => 70, 'neutral' => true];
    [$alerts, $bonus] = TriangleValidator::analyze($m1, $m6Online, $m6Offline, null, 3);

    $types = array_column($alerts, 'type');
    expect($types)->toContain('unstable_market');
    expect($bonus)->toBe(0);
});
