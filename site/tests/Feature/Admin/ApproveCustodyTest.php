<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Asset;
use App\Models\Loan;
use App\Models\User;
use App\Services\SolanaBridge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Covers the bridge-wired path of AdminController::approveCustody.
 *
 * The product pitch hinges on "money cannot disburse without on-chain
 * custody confirmation" — these tests pin down that contract from the
 * Laravel side:
 *   - Bridge `ok:true` → loan transitions to `active`, `confirm_custody_tx`
 *     persisted, `solana_loan_id` backfilled.
 *   - Bridge anything else → state unchanged, error flashed, no notify.
 *
 * The bridge is swapped in the container via Mockery so we don't need a
 * live HTTP server. Live wire is exercised separately in the gated
 * integration test under tests/Feature/Services/.
 */
class ApproveCustodyTest extends TestCase
{
    use RefreshDatabase;

    private function makeAsset(int $userId): Asset
    {
        return Asset::create([
            'user_id' => $userId,
            'category' => 'watch',
            'brand' => 'Rolex',
            'model' => 'Submariner',
            'description' => 'Test asset for approveCustody',
            'condition' => 'excellent',
            'estimated_value' => 15000,
            'appraised_value' => 15000,
            'appraisal_date' => now(),
            'custody_status' => 'evaluated',
            'custody_location' => 'Vault #001',
        ]);
    }

    private function makePendingLoan(User $user, Asset $asset): Loan
    {
        return Loan::create([
            'code' => Loan::generateCode(),
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'status' => 'pending_custody',
            'asset_value' => 15000,
            'ltv_percent' => 50,
            'principal' => 7500,
            'interest_rate' => 24,
            'origination_fee_percent' => 2.5,
            'origination_fee' => 187.5,
            'term_months' => 12,
            'currency' => 'USDC',
            'outstanding_balance' => 7500,
        ]);
    }

    public function test_approves_loan_and_persists_tx_when_bridge_returns_ok(): void
    {
        $admin = User::factory()->admin()->create();
        $borrower = User::factory()->create();
        $asset = $this->makeAsset($borrower->id);
        $loan = $this->makePendingLoan($borrower, $asset);

        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('confirmCustodyAndDisburse')
            ->once()
            ->with($loan->solana_loan_id) // accessor returns deterministic value
            ->andReturn([
                'ok' => true,
                'status' => 200,
                'txSignature' => 'placeholder-confirm-custody-1730000000',
                'loanId' => $loan->solana_loan_id,
                'accounts' => ['loanConfig' => 'XYZ', 'trdcState' => 'ABC'],
                'unsignedTx' => null,
                '_placeholder' => true,
            ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->actingAs($admin)->post(route('admin.loan.approve', $loan));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $loan->refresh();
        $this->assertSame('active', $loan->status);
        $this->assertSame('placeholder-confirm-custody-1730000000', $loan->confirm_custody_tx);
        $this->assertNotEmpty($loan->getRawOriginal('solana_loan_id'));

        $asset->refresh();
        $this->assertSame('in_custody', $asset->custody_status);
    }

    public function test_blocks_approval_when_bridge_returns_ok_false(): void
    {
        $admin = User::factory()->admin()->create();
        $borrower = User::factory()->create();
        $asset = $this->makeAsset($borrower->id);
        $loan = $this->makePendingLoan($borrower, $asset);

        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('confirmCustodyAndDisburse')
            ->once()
            ->andReturn([
                'ok' => false,
                'status' => 0,
                'error' => 'network_error',
            ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->actingAs($admin)->post(route('admin.loan.approve', $loan));

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertStringContainsString(
            'network_error',
            (string) session('error'),
            'admin should see the bridge error code, not a generic message',
        );

        $loan->refresh();
        $this->assertSame('pending_custody', $loan->status, 'state must not advance on bridge failure');
        $this->assertNull($loan->confirm_custody_tx);

        $asset->refresh();
        $this->assertSame('evaluated', $asset->custody_status, 'asset must not flip to in_custody on bridge failure');
    }

    public function test_blocks_approval_when_bridge_short_circuits_unconfigured(): void
    {
        $admin = User::factory()->admin()->create();
        $borrower = User::factory()->create();
        $asset = $this->makeAsset($borrower->id);
        $loan = $this->makePendingLoan($borrower, $asset);

        // Same shape SolanaBridge::send returns when secret/baseUrl are empty.
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('confirmCustodyAndDisburse')
            ->once()
            ->andReturn([
                'ok' => false,
                'status' => 0,
                'error' => 'bridge_not_configured',
            ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->actingAs($admin)->post(route('admin.loan.approve', $loan));

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertStringContainsString('bridge_not_configured', (string) session('error'));

        $loan->refresh();
        $this->assertSame('pending_custody', $loan->status);
    }

    public function test_rejects_loan_already_active(): void
    {
        $admin = User::factory()->admin()->create();
        $borrower = User::factory()->create();
        $asset = $this->makeAsset($borrower->id);
        $loan = $this->makePendingLoan($borrower, $asset);
        $loan->update(['status' => 'active']);

        // Bridge must NOT be called for non-pending loans.
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldNotReceive('confirmCustodyAndDisburse');
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->actingAs($admin)->post(route('admin.loan.approve', $loan));

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_solana_loan_id_is_deterministic_and_stable_across_retries(): void
    {
        $borrower = User::factory()->create();
        $asset = $this->makeAsset($borrower->id);
        $loan = $this->makePendingLoan($borrower, $asset);

        $first = $loan->solana_loan_id;
        $second = $loan->solana_loan_id;
        $static = Loan::deriveDeterministicSolanaLoanId((int) $loan->id);

        $this->assertSame($first, $second, 'two reads of the accessor must return the same value');
        $this->assertSame($first, $static, 'static helper must match the accessor');
        // base58 alphabet: no 0, O, I, l. Length is 43-44 chars for 32 bytes.
        $this->assertMatchesRegularExpression('/^[1-9A-HJ-NP-Za-km-z]{43,44}$/', $first);
    }
}
