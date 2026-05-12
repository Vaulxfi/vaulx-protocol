<?php

use App\Models\Asset;
use App\Models\CronRun;
use App\Models\Loan;
use App\Models\User;
use App\Notifications\ReengagementOffer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function makeRepaidLoanForReengagement(User $user, int $daysAgo): Loan {
    $asset = Asset::create([
        'user_id' => $user->id, 'category' => 'watch', 'brand' => 'Rolex', 'model' => 'GMT',
        'description' => 'x', 'condition' => 'excellent', 'estimated_value' => 18000,
        'appraised_value' => 18000, 'appraisal_date' => now()->subDays($daysAgo + 7),
        'custody_status' => 'released',
    ]);
    return Loan::create([
        'code' => Loan::generateCode(),
        'user_id' => $user->id,
        'asset_id' => $asset->id,
        'status' => 'repaid',
        'asset_value' => 18000, 'ltv_percent' => 55, 'principal' => 9900,
        'interest_rate' => 24, 'origination_fee_percent' => 2.5, 'origination_fee' => 247.5,
        'term_months' => 6, 'currency' => 'USDC',
        'total_repaid' => 9900, 'outstanding_balance' => 0,
        'repaid_at' => now()->subDays($daysAgo),
    ]);
}

it('reengagement command sends email to borrowers whose loan was repaid 30 days ago', function () {
    Notification::fake();
    $user = User::factory()->create();
    makeRepaidLoanForReengagement($user, 30);

    $this->artisan('garantifi:reengagement')->assertSuccessful();

    Notification::assertSentTo($user, ReengagementOffer::class);
});

it('reengagement command skips users with open loans', function () {
    Notification::fake();
    $user = User::factory()->create();
    $repaidLoan = makeRepaidLoanForReengagement($user, 30);

    Loan::create([
        'code' => Loan::generateCode(), 'user_id' => $user->id, 'asset_id' => $repaidLoan->asset_id,
        'status' => 'active', 'asset_value' => 1000, 'ltv_percent' => 50, 'principal' => 500,
        'interest_rate' => 24, 'origination_fee_percent' => 2.5, 'origination_fee' => 12.5,
        'term_months' => 6, 'currency' => 'USDC', 'outstanding_balance' => 500,
    ]);

    $this->artisan('garantifi:reengagement')->assertSuccessful();
    Notification::assertNothingSent();
});

it('reengagement command does NOT send to loans repaid yesterday', function () {
    Notification::fake();
    $user = User::factory()->create();
    makeRepaidLoanForReengagement($user, 1);

    $this->artisan('garantifi:reengagement')->assertSuccessful();
    Notification::assertNothingSent();
});

it('reengagement command writes a CronRun row', function () {
    $user = User::factory()->create();
    makeRepaidLoanForReengagement($user, 30);

    $this->artisan('garantifi:reengagement')->assertSuccessful();

    $run = CronRun::where('name', 'reengagement')->latest('id')->first();
    expect($run)->not->toBeNull();
    expect($run->scanned)->toBe(1);
    expect($run->affected)->toBe(1);
});

it('dry mode counts but does not send', function () {
    Notification::fake();
    $user = User::factory()->create();
    makeRepaidLoanForReengagement($user, 30);

    $this->artisan('garantifi:reengagement', ['--dry' => true])->assertSuccessful();
    Notification::assertNothingSent();
});

it('feature flag disabled stops the command', function () {
    Notification::fake();
    config(['garantifi.features.reengagement_drip' => false]);
    $user = User::factory()->create();
    makeRepaidLoanForReengagement($user, 30);

    $this->artisan('garantifi:reengagement')->assertSuccessful();
    Notification::assertNothingSent();
});
