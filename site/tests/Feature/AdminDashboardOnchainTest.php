<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\SolanaBridge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Covers the on-chain snapshot wired into AdminController::dashboard. The
 * SolanaBridge is swapped via the container so we don't need a live bridge
 * to exercise the controller. End-to-end live wire is verified by the
 * gated SolanaBridgeIntegrationTest in tests/Feature/Services/.
 */
class AdminDashboardOnchainTest extends TestCase
{
    use RefreshDatabase;

    private function fakeLoanConfigOk(): array
    {
        return [
            'ok' => true,
            'status' => 200,
            'data' => [
                'pda' => '5Thh',
                'fields' => [
                    'admin' => '2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH',
                    'custodian' => '2HYjytRc4oKY2ndmJfAq2XdGhPqYB7VdDPLzA18QEiAH',
                    'kyc_required' => false,
                    'oracle_admin' => '11111111111111111111111111111111',
                    'civic_network' => 'ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6',
                    'bump' => 255,
                ],
            ],
        ];
    }

    private function fakeVaultOk(): array
    {
        return [
            'ok' => true,
            'status' => 200,
            'data' => [
                'pda' => 'VaultPdaXXX',
                'lamports' => 2_039_280,
                'slot' => 459_372_837,
                'fields' => [
                    'asset_mint' => '3eXFpUHRtg7UdJviTtz9LP87LfGk2aYsPDfkjDFai672',
                    'total_assets' => 1_500_000_000, // 1500 USDC
                    'total_shares' => 1_500_000_000,
                ],
            ],
        ];
    }

    public function test_renders_on_chain_snapshot_when_both_bridge_reads_succeed(): void
    {
        $admin = User::factory()->admin()->create();

        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readLoanConfig')->once()->andReturn($this->fakeLoanConfigOk());
        $bridge->shouldReceive('readVault')->once()->andReturn($this->fakeVaultOk());
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk();
        $response->assertSee('On-chain snapshot');
        $response->assertSee('Loan config');
        $response->assertSee('1,500.00 USDC');
        $response->assertSee('disabled'); // oracle_admin == default
        $response->assertSee('459372837', false); // slot, no escape
    }

    public function test_renders_graceful_fallback_when_vault_is_not_initialized(): void
    {
        $admin = User::factory()->admin()->create();

        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readLoanConfig')->once()->andReturn($this->fakeLoanConfigOk());
        $bridge->shouldReceive('readVault')->once()->andReturn([
            'ok' => false,
            'status' => 404,
            'error' => 'account_not_found',
        ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk();
        $response->assertSee('On-chain snapshot');
        $response->assertSee('Loan config'); // loan_config still rendered
        $response->assertSee('Vault not initialized'); // friendly fallback
        $response->assertSee('moment-1-e2e.ts'); // actionable copy
    }

    public function test_renders_graceful_fallback_when_bridge_is_offline(): void
    {
        $admin = User::factory()->admin()->create();

        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readLoanConfig')->once()->andReturn([
            'ok' => false, 'status' => 0, 'error' => 'network_error',
        ]);
        $bridge->shouldReceive('readVault')->once()->andReturn([
            'ok' => false, 'status' => 0, 'error' => 'network_error',
        ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk();
        $response->assertSee('Bridge offline · loan_config: network_error');
        $response->assertSee('Bridge offline · vault: network_error');
    }

    public function test_caches_successful_bridge_calls_across_requests(): void
    {
        $admin = User::factory()->admin()->create();

        // Mockery's `->once()` doubles as the cache assertion: the test
        // fails in teardown if either method is called more than once
        // across both dashboard hits, proving the 10s cache held.
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readLoanConfig')->once()->andReturn($this->fakeLoanConfigOk());
        $bridge->shouldReceive('readVault')->once()->andReturn($this->fakeVaultOk());
        $this->app->instance(SolanaBridge::class, $bridge);

        $this->actingAs($admin)->get('/admin')->assertOk();
        $this->actingAs($admin)->get('/admin')->assertOk();
    }
}
