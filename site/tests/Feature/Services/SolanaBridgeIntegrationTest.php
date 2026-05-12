<?php

declare(strict_types=1);

namespace Tests\Feature\Services;

use App\Services\SolanaBridge;
use Tests\TestCase;

/**
 * End-to-end check against a live bridge. Skipped by default — flip
 * `SOLANA_BRIDGE_INTEGRATION=true` in the test env (and set
 * `SOLANA_BRIDGE_BASE_URL` + `SOLANA_BRIDGE_SHARED_SECRET` to match the
 * bridge process) to enable it. Used the same skip pattern as the
 * vaulx-protocol `moments E2E` specs so CI never blocks on infra.
 */
class SolanaBridgeIntegrationTest extends TestCase
{
    public function test_health_against_live_bridge(): void
    {
        if (env('SOLANA_BRIDGE_INTEGRATION') !== 'true') {
            $this->markTestSkipped(
                'Set SOLANA_BRIDGE_INTEGRATION=true and ensure the bridge is running '
                . '(cd vaulx-protocol/apps/bridge && pnpm start) to enable this test. '
                . 'SOLANA_BRIDGE_BASE_URL and SOLANA_BRIDGE_SHARED_SECRET must point '
                . 'to the same values the bridge process is using.',
            );
        }

        $bridge = $this->app->make(SolanaBridge::class);
        $result = $bridge->health();

        $this->assertTrue(
            $result['ok'],
            'Bridge health check failed: ' . json_encode($result),
        );
        $this->assertSame(200, $result['status']);
        $this->assertSame('vaulx-bridge', $result['service'] ?? null);
    }
}
