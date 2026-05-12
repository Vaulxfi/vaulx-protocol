<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\SolanaBridge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Covers the "Live capacity" banner on /simulator. Only `readVault` is
 * fetched here (the simulator's LTV / rate sliders cover what would
 * otherwise come from `LoanConfig`, which is constant-driven anyway).
 * Banner hides on 404 / offline so the simulator works standalone when
 * the bridge or the vault isn't reachable.
 */
class SimulatorOnchainCapacityTest extends TestCase
{
    use RefreshDatabase;

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
                    'total_assets' => 7_500_000_000, // 7,500 USDC
                    'total_shares' => 7_500_000_000,
                ],
            ],
        ];
    }

    public function test_simulator_renders_live_capacity_banner_when_vault_read_succeeds(): void
    {
        $bridge = Mockery::mock(SolanaBridge::class);
        // Only `readVault` is called on this route — `readLoanConfig`
        // intentionally not invoked.
        $bridge->shouldReceive('readVault')->once()->andReturn($this->fakeVaultOk());
        $bridge->shouldNotReceive('readLoanConfig');
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->get('/simulator');

        $response->assertOk();
        $response->assertSee('Loan Simulator');
        $response->assertSee('7,500 USDC');         // live capacity formatted
        $response->assertSee('available right now');
        $response->assertSee('refreshed');
    }

    public function test_simulator_hides_capacity_banner_when_vault_not_initialized(): void
    {
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readVault')->once()->andReturn([
            'ok' => false, 'status' => 404, 'error' => 'account_not_found',
        ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->get('/simulator');

        $response->assertOk();
        $response->assertSee('Loan Simulator');
        // Banner hidden so the simulator works standalone.
        $response->assertDontSee('available right now');
        $response->assertDontSee('refreshed');
    }

    public function test_simulator_hides_capacity_banner_when_bridge_is_offline(): void
    {
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readVault')->once()->andReturn([
            'ok' => false, 'status' => 0, 'error' => 'network_error',
        ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->get('/simulator');

        $response->assertOk();
        $response->assertSee('Loan Simulator');
        $response->assertDontSee('available right now');
    }

    public function test_simulator_caches_vault_read_for_60s(): void
    {
        // Same Mockery `->once()` cache assertion pattern as the home /
        // admin tests: a second hit must not re-call the bridge.
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readVault')->once()->andReturn($this->fakeVaultOk());
        $this->app->instance(SolanaBridge::class, $bridge);

        $this->get('/simulator')->assertOk();
        $this->get('/simulator')->assertOk();
    }
}
