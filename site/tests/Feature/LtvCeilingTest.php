<?php

use App\Models\Asset;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createAppraisedAsset(User $user, float $appraisedValue = 10000): Asset
{
    return Asset::create([
        'user_id' => $user->id,
        'category' => 'watch',
        'brand' => 'Rolex',
        'model' => 'Submariner',
        'description' => 'x',
        'condition' => 'excellent',
        'estimated_value' => $appraisedValue,
        'appraised_value' => $appraisedValue,
        'appraisal_date' => now()->subDays(5),
        'custody_status' => 'evaluated',
    ]);
}

it('config max_ltv_pct defaults to 60', function () {
    expect((int) config('garantifi.lending.max_ltv_pct'))->toBe(60);
});

it('storeLoan rejects principal above 60% ceiling on $10k asset', function () {
    $user = User::factory()->create();
    $asset = createAppraisedAsset($user, 10000);
    $this->actingAs($user);

    // 60% of $10k = $6k. $6001 should be rejected.
    $response = $this->post(route('borrower.loan.store'), [
        'asset_id' => $asset->id,
        'currency' => 'USDC',
        'principal' => 6001,
        'term_months' => 6,
    ]);
    $response->assertSessionHas('error');
    expect(Loan::count())->toBe(0);
});

it('storeLoan accepts principal exactly at the ceiling', function () {
    $user = User::factory()->create();
    $asset = createAppraisedAsset($user, 10000);
    $this->actingAs($user);

    // 60% of $10k = $6k — exactly at the ceiling.
    $this->post(route('borrower.loan.store'), [
        'asset_id' => $asset->id,
        'currency' => 'USDC',
        'principal' => 6000,
        'term_months' => 6,
    ]);

    expect(Loan::count())->toBe(1);
    expect((float) Loan::first()->principal)->toBe(6000.00);
});

it('storeLoan accepts a fraction of the ceiling (slider dialed down)', function () {
    $user = User::factory()->create();
    $asset = createAppraisedAsset($user, 10000);
    $this->actingAs($user);

    // 60% of the $5k ceiling = $3000
    $this->post(route('borrower.loan.store'), [
        'asset_id' => $asset->id,
        'currency' => 'USDC',
        'principal' => 3000,
        'term_months' => 12,
    ]);

    $loan = Loan::first();
    expect((float) $loan->principal)->toBe(3000.00);
    expect((float) $loan->ltv_percent)->toBe(30.00); // 3000/10000
});

it('reloan respects the ceiling too', function () {
    $user = User::factory()->create();
    $asset = createAppraisedAsset($user, 10000);
    Loan::create([
        'code' => Loan::generateCode(),
        'user_id' => $user->id,
        'asset_id' => $asset->id,
        'status' => 'repaid',
        'asset_value' => 10000,
        'ltv_percent' => 50,
        'principal' => 5000,
        'interest_rate' => 24,
        'origination_fee_percent' => 2.5,
        'origination_fee' => 125,
        'term_months' => 6,
        'currency' => 'USDC',
        'total_repaid' => 5000,
        'outstanding_balance' => 0,
        'repaid_at' => now()->subDays(10),
    ]);
    $asset->update(['custody_status' => 'released']);
    $this->actingAs($user);

    // Try to re-loan above ceiling (60% of $10k = $6k)
    $response = $this->post(route('borrower.reloan.store', $asset), [
        'currency' => 'USDC',
        'principal' => 6001,
        'term_months' => 6,
    ]);
    $response->assertSessionHas('error');

    // Re-loan within ceiling works
    $this->post(route('borrower.reloan.store', $asset), [
        'currency' => 'USDC',
        'principal' => 4000,
        'term_months' => 6,
    ]);
    $newLoan = Loan::latest('id')->first();
    expect($newLoan->status)->toBe('pending_custody');
    expect((float) $newLoan->principal)->toBe(4000.00);
});

it('config-overridable: setting max_ltv_pct=30 narrows the ceiling', function () {
    config(['garantifi.lending.max_ltv_pct' => 30]);
    $user = User::factory()->create();
    $asset = createAppraisedAsset($user, 10000);
    $this->actingAs($user);

    // With 30% LTV, ceiling is $3000. $4000 is rejected.
    $response = $this->post(route('borrower.loan.store'), [
        'asset_id' => $asset->id,
        'currency' => 'USDC',
        'principal' => 4000,
        'term_months' => 6,
    ]);
    $response->assertSessionHas('error');
});
