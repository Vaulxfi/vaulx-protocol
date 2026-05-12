<?php

use App\Services\InterestCalculator;

it('returns zero for zero principal', function () {
    expect(InterestCalculator::simpleInterest(0, 2400, 86400))->toBe(0.0);
});

it('returns zero for zero elapsed', function () {
    expect(InterestCalculator::simpleInterest(1000, 2400, 0))->toBe(0.0);
});

it('calculates linear simple interest for a full year at 24% APR', function () {
    $interest = InterestCalculator::simpleInterest(10000, 2400, InterestCalculator::SECONDS_PER_YEAR);
    expect($interest)->toBe(2400.00);
});

it('calculates interest for 3 months (90d) at 24% APR on BRL 5000', function () {
    $interest = InterestCalculator::interestForMonths(5000, 2400, 3);
    expect($interest)->toBeGreaterThan(295.00)->toBeLessThan(310.00);
});

it('mora accrues monthly, minimum one month', function () {
    $lateFee = InterestCalculator::lateFee(5000, 150, 1);
    expect($lateFee)->toBe(75.00);
});

it('mora grows linearly per month overdue', function () {
    $oneMonth = InterestCalculator::lateFee(5000, 150, InterestCalculator::SECONDS_PER_MONTH);
    $threeMonths = InterestCalculator::lateFee(5000, 150, 3 * InterestCalculator::SECONDS_PER_MONTH);
    expect($threeMonths)->toBe($oneMonth * 3);
});

it('totalDue combines principal + interest (+ late when overdue)', function () {
    $result = InterestCalculator::totalDue(5000, 2400, 3);
    expect($result['principal'])->toBe(5000.00)
        ->and($result['late_fee'])->toBe(0.0)
        ->and($result['total'])->toBe(5000.00 + $result['interest']);
});

it('totalDue adds late fee when overdue > 0', function () {
    $result = InterestCalculator::totalDue(5000, 2400, 3, InterestCalculator::SECONDS_PER_MONTH, 150);
    expect($result['late_fee'])->toBe(75.00)
        ->and($result['total'])->toBe($result['principal'] + $result['interest'] + 75.00);
});

it('linearSchedule produces the correct number of rows', function () {
    $schedule = InterestCalculator::linearSchedule(12000, 2400, 12);
    expect($schedule)->toHaveCount(12);
});

it('linearSchedule amortizes principal fully by the last installment', function () {
    $principal = 12000.0;
    $schedule = InterestCalculator::linearSchedule($principal, 2400, 12);
    $lastRow = $schedule[11];
    expect((float) $lastRow['balance_after'])->toBe(0.0);
    $totalPrincipal = array_sum(array_column($schedule, 'principal'));
    expect($totalPrincipal)->toBe($principal);
});

it('linearSchedule has constant monthly interest (not Price table)', function () {
    $schedule = InterestCalculator::linearSchedule(12000, 2400, 6);
    $interests = array_column($schedule, 'interest');
    expect(array_unique($interests))->toHaveCount(1);
});

it('linearSchedule last row absorbs rounding remainder', function () {
    // 10001 / 3 = 3333.67 not exact; last row must compensate
    $schedule = InterestCalculator::linearSchedule(10001, 2400, 3);
    $totalPrincipal = array_sum(array_column($schedule, 'principal'));
    expect($totalPrincipal)->toBe(10001.00);
});
