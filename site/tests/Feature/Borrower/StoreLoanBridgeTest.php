<?php

declare(strict_types=1);

namespace Tests\Feature\Borrower;

use App\Models\Asset;
use App\Models\Loan;
use App\Models\OnchainEvent;
use App\Models\User;
use App\Services\SolanaBridge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Covers the bridge-wired path of BorrowerController::storeLoan: a
 * borrower's loan request now mints a real on-chain `trdc_state` PDA
 * via `loan::create_ccb_trdc` BEFORE the Laravel row is persisted, so
 * the eventual admin-side `confirm_custody` always has a real
 * counterpart to flip into Active.
 *
 * Bridge is swapped via the container with Mockery so we don't need a
 * live HTTP server. Pest-style sibling tests in tests/Feature/
 * LtvCeilingTest.php exercise the input validation paths that fire
 * BEFORE the bridge is called (LTV ceiling, missing field, etc.) — no
 * conflict because the bridge call sits after the validation gate.
 */
class StoreLoanBridgeTest extends TestCase
{
    use RefreshDatabase;

    private function makeAppraisedAsset(int $userId): Asset
    {
        return Asset::create([
            'user_id' => $userId,
            'category' => 'watch',
            'brand' => 'Rolex',
            'model' => 'Submariner',
            'description' => 'Fixture asset for storeLoan bridge test',
            'condition' => 'excellent',
            // Use realistic-ish values — the controller validates principal
            // ≥ 100 (USD) on the request, so a $1k asset + $400 principal
            // (40% LTV, well under 50% cap) keeps the happy path live.
            'estimated_value' => 1000,
            'appraised_value' => 1000,
            'appraisal_date' => now(),
            'custody_status' => 'evaluated',
            'custody_location' => 'Vaulx Vault #001',
        ]);
    }

    public function test_persists_loan_with_solana_loan_id_when_bridge_returns_ok(): void
    {
        $borrower = User::factory()->create();
        $asset = $this->makeAppraisedAsset($borrower->id);

        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('createCcbTrdc')
            ->once()
            ->withArgs(function ($appraisalAtoms, $loanAmountAtoms, $termDays, $rateBps) {
                // 1000 USDC -> 1B atoms; 400 USDC -> 400M; 6 months -> 180 days; 24% -> 2400bps
                return $appraisalAtoms === 1_000_000_000
                    && $loanAmountAtoms === 400_000_000
                    && $termDays === 180
                    && $rateBps === 2400;
            })
            ->andReturn([
                'ok' => true,
                'status' => 200,
                'txSignature' => 'CreateCcbTrdcSig' . str_repeat('a', 70),
                'loanId' => 'OnchainLoanIdABC' . str_repeat('a', 28),
                'accounts' => ['loanConfig' => 'L', 'trdcState' => 'T'],
                'unsignedTx' => null,
                'executed' => true,
            ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $r = $this->actingAs($borrower)->post(route('borrower.loan.store'), [
            'asset_id' => $asset->id,
            'currency' => 'USDC',
            'principal' => 400,
            'term_months' => 6,
        ]);

        $r->assertRedirect();
        $r->assertSessionHas('success');
        $this->assertSame(1, Loan::count());

        $loan = Loan::first();
        $this->assertSame('pending_custody', $loan->status);
        $this->assertSame(
            'OnchainLoanIdABC' . str_repeat('a', 28),
            $loan->getRawOriginal('solana_loan_id'),
        );
        $this->assertEquals(400, (float) $loan->principal);
        $this->assertSame(6, (int) $loan->term_months);

        // create_ccb_trdc tx was logged to the on-chain events feed so
        // the admin sees it without waiting for the webhook listener.
        $event = OnchainEvent::where('event_name', 'ccb-trdc-created')->first();
        $this->assertNotNull($event);
        $this->assertSame('CreateCcbTrdcSig' . str_repeat('a', 70), $event->signature);
        $this->assertSame($loan->code, $event->payload['laravel_loan_code']);
    }

    public function test_blocks_loan_creation_when_bridge_returns_ok_false(): void
    {
        $borrower = User::factory()->create();
        $asset = $this->makeAppraisedAsset($borrower->id);

        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('createCcbTrdc')
            ->once()
            ->andReturn([
                'ok' => false,
                'status' => 422,
                'error' => 'LtvTooHigh',
                'details' => 'AnchorError ...',
            ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $r = $this->actingAs($borrower)->post(route('borrower.loan.store'), [
            'asset_id' => $asset->id,
            'currency' => 'USDC',
            'principal' => 400,
            'term_months' => 6,
        ]);

        $r->assertRedirect();
        $r->assertSessionHas('error');
        $this->assertStringContainsString('LtvTooHigh', (string) session('error'));
        $this->assertSame(0, Loan::count(), 'no Laravel row when on-chain mint fails');
        $this->assertSame(0, OnchainEvent::count());
    }

    public function test_blocks_loan_creation_when_bridge_unreachable(): void
    {
        $borrower = User::factory()->create();
        $asset = $this->makeAppraisedAsset($borrower->id);

        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('createCcbTrdc')
            ->once()
            ->andReturn([
                'ok' => false,
                'status' => 0,
                'error' => 'network_error',
            ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $r = $this->actingAs($borrower)->post(route('borrower.loan.store'), [
            'asset_id' => $asset->id,
            'currency' => 'USDC',
            'principal' => 400,
            'term_months' => 6,
        ]);

        $r->assertRedirect();
        $r->assertSessionHas('error');
        $this->assertStringContainsString('network_error', (string) session('error'));
        $this->assertSame(0, Loan::count());
    }
}
