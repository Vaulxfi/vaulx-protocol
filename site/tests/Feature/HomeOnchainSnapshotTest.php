<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\SolanaBridge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Covers the live-on-chain stats strip on the public homepage. The
 * SolanaBridge is swapped via the container so we don't need a live
 * bridge to exercise the controller. Cache TTL on the home is 60s
 * (vs 10s on the admin dashboard); the cache assertion in the last
 * test relies on Mockery's `->once()` rather than time travel.
 */
class HomeOnchainSnapshotTest extends TestCase
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
                    'total_assets' => 2_500_000_000, // 2500 USDC
                    'total_shares' => 2_500_000_000,
                ],
            ],
        ];
    }

    public function test_homepage_renders_stats_strip_when_both_bridge_reads_succeed(): void
    {
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readLoanConfig')->once()->andReturn($this->fakeLoanConfigOk());
        $bridge->shouldReceive('readVault')->once()->andReturn($this->fakeVaultOk());
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('live · devnet · refreshed');
        $response->assertSee('2,500');           // USDC in vault formatted
        $response->assertSee('USDC in vault');
        $response->assertSee('459,372,837');      // slot, with thousands separator
        $response->assertSee('KYC gate');
        $response->assertSee('RedStone oracle');
    }

    public function test_homepage_hides_strip_when_both_reads_are_offline(): void
    {
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readLoanConfig')->once()->andReturn([
            'ok' => false, 'status' => 0, 'error' => 'network_error',
        ]);
        $bridge->shouldReceive('readVault')->once()->andReturn([
            'ok' => false, 'status' => 0, 'error' => 'network_error',
        ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->get('/');

        // Page still renders cleanly with the static narrative.
        $response->assertOk();
        $response->assertSee('Your Assets');
        // But the live-stats strip is hidden when no bridge data.
        $response->assertDontSee('live · devnet · refreshed');
    }

    public function test_homepage_renders_partial_strip_when_only_loan_config_is_available(): void
    {
        // Vault not initialised (404), but loan_config works. Strip
        // shows just the KYC + oracle columns; no USDC/slot tiles.
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readLoanConfig')->once()->andReturn($this->fakeLoanConfigOk());
        $bridge->shouldReceive('readVault')->once()->andReturn([
            'ok' => false, 'status' => 404, 'error' => 'account_not_found',
        ]);
        $this->app->instance(SolanaBridge::class, $bridge);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('live · devnet · refreshed');
        $response->assertSee('KYC gate');
        $response->assertSee('RedStone oracle');
        $response->assertDontSee('USDC in vault'); // vault tile hidden
    }

    public function test_homepage_caches_successful_bridge_calls_for_60s(): void
    {
        // Mockery's `->once()` doubles as the cache assertion: the test
        // fails at teardown if either method is called more than once
        // across both homepage hits, proving the 60s home-side cache held.
        $bridge = Mockery::mock(SolanaBridge::class);
        $bridge->shouldReceive('readLoanConfig')->once()->andReturn($this->fakeLoanConfigOk());
        $bridge->shouldReceive('readVault')->once()->andReturn($this->fakeVaultOk());
        $this->app->instance(SolanaBridge::class, $bridge);

        $this->get('/')->assertOk();
        $this->get('/')->assertOk();
    }
}
