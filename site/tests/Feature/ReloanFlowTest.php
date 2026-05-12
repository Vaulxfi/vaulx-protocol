<?php

use App\Models\Asset;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeRepaidLoan(User $user, array $assetOverrides = [], array $loanOverrides = []): Loan {
    $asset = Asset::create(array_merge([
        'user_id' => $user->id,
        'category' => 'watch',
        'brand' => 'Rolex',
        'model' => 'Submariner',
        'description' => 'Test asset',
        'condition' => 'excellent',
        'estimated_value' => 15000,
        'appraised_value' => 15000,
        'appraisal_date' => now()->subDays(10),
        'custody_status' => 'released',
    ], $assetOverrides));

    return Loan::create(array_merge([
        'code' => Loan::generateCode(),
        'user_id' => $user->id,
        'asset_id' => $asset->id,
        'status' => 'repaid',
        'asset_value' => $asset->appraised_value,
        'ltv_percent' => 55,
        'principal' => 8250,
        'interest_rate' => 24,
        'origination_fee_percent' => 2.5,
        'origination_fee' => 206.25,
        'term_months' => 12,
        'currency' => 'USDC',
        'total_repaid' => 8250,
        'outstanding_balance' => 0,
        'repaid_at' => now()->subDays(5),
    ], $loanOverrides));
}

it('Loan::reloanEligible returns true for fully repaid loan with recent appraisal', function () {
    $user = User::factory()->create();
    $loan = makeRepaidLoan($user);
    expect(Loan::reloanEligible($loan->asset))->toBeTrue();
});

it('Loan::reloanEligible returns false when no repaid loan exists', function () {
    $user = User::factory()->create();
    $asset = Asset::create([
        'user_id' => $user->id, 'category' => 'watch', 'brand' => 'Rolex', 'model' => 'X',
        'description' => 'x', 'condition' => 'good', 'estimated_value' => 1000,
        'appraised_value' => 1000, 'appraisal_date' => now(), 'custody_status' => 'released',
    ]);
    expect(Loan::reloanEligible($asset))->toBeFalse();
});

it('Loan::reloanEligible returns false when appraisal is older than 180 days', function () {
    $user = User::factory()->create();
    $loan = makeRepaidLoan($user, ['appraisal_date' => now()->subDays(200)]);
    expect(Loan::reloanEligible($loan->asset))->toBeFalse();
});

it('Loan::reloanEligible returns false when there is an open loan against the asset', function () {
    $user = User::factory()->create();
    $loan = makeRepaidLoan($user);
    Loan::create([
        'code' => Loan::generateCode(),
        'user_id' => $user->id,
        'asset_id' => $loan->asset_id,
        'status' => 'active',
        'asset_value' => 15000, 'ltv_percent' => 50, 'principal' => 7500,
        'interest_rate' => 24, 'origination_fee_percent' => 2.5, 'origination_fee' => 187.5,
        'term_months' => 12, 'currency' => 'USDC',
        'outstanding_balance' => 7500,
    ]);
    expect(Loan::reloanEligible($loan->asset))->toBeFalse();
});

it('borrower can submit a re-loan one-click', function () {
    $user = User::factory()->create();
    $loan = makeRepaidLoan($user);
    $this->actingAs($user);

    $response = $this->post(route('borrower.reloan.store', $loan->asset), [
        'currency' => 'BRZ',
        'principal' => 5000,
        'term_months' => 6,
    ]);

    $newLoan = Loan::latest('id')->first();
    expect($newLoan->id)->not->toBe($loan->id);
    expect($newLoan->status)->toBe('pending_custody');
    expect((float) $newLoan->principal)->toBe(5000.00);
    expect($newLoan->currency)->toBe('BRZ');
    expect($newLoan->admin_notes)->toContain('Re-loan');
    $response->assertRedirect(route('borrower.loan.show', $newLoan));
});

it('re-loan rejected when asset not eligible', function () {
    $user = User::factory()->create();
    $asset = Asset::create([
        'user_id' => $user->id, 'category' => 'watch', 'brand' => 'X', 'model' => 'X',
        'description' => 'x', 'condition' => 'good', 'estimated_value' => 1000,
        'appraised_value' => 1000, 'appraisal_date' => now(), 'custody_status' => 'released',
    ]);
    $this->actingAs($user);

    $response = $this->post(route('borrower.reloan.store', $asset), [
        'currency' => 'USDC',
        'principal' => 500,
        'term_months' => 6,
    ]);
    $response->assertStatus(422);
});

it('reloan principal cannot exceed appraised value', function () {
    $user = User::factory()->create();
    $loan = makeRepaidLoan($user);
    $this->actingAs($user);

    $response = $this->post(route('borrower.reloan.store', $loan->asset), [
        'currency' => 'USDC',
        'principal' => 100000,
        'term_months' => 12,
    ]);
    $response->assertSessionHas('error');
});
