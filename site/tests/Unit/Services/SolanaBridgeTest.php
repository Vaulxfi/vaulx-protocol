<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\SolanaBridge;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SolanaBridgeTest extends TestCase
{
    private const BASE = 'http://127.0.0.1:8787';
    private const SECRET = 'test-secret-do-not-use-in-production';

    private SolanaBridge $bridge;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bridge = new SolanaBridge(self::BASE, self::SECRET, 30);
    }

    /**
     * Recompute HMAC over (ts, method, path, body) and verify the header
     * the request actually carried matches. Run this assertion at the end
     * of any test that exercises a real send path.
     */
    private function assertHmacValid(): void
    {
        Http::assertSent(function (Request $req) {
            $tsHeader = $req->header('X-Vaulx-Timestamp');
            $sigHeader = $req->header('X-Vaulx-Signature');
            $ts = is_array($tsHeader) ? ($tsHeader[0] ?? '') : (string) $tsHeader;
            $sig = is_array($sigHeader) ? ($sigHeader[0] ?? '') : (string) $sigHeader;
            if ($ts === '' || $sig === '') {
                return false;
            }
            $method = $req->method();
            $path = parse_url($req->url(), PHP_URL_PATH) ?: '';
            $body = (string) $req->body();
            $expected = hash_hmac(
                'sha256',
                $ts . "\n" . $method . "\n" . $path . "\n" . $body,
                self::SECRET,
            );
            return hash_equals($expected, $sig);
        });
    }

    // ---------- Read endpoints ----------

    public function test_health_returns_normalized_response_with_passthrough_fields(): void
    {
        Http::fake([
            self::BASE . '/chain/health' => Http::response([
                'ok' => true,
                'service' => 'vaulx-bridge',
                'cluster' => 'devnet',
            ], 200),
        ]);

        $result = $this->bridge->health();

        $this->assertTrue($result['ok']);
        $this->assertSame(200, $result['status']);
        $this->assertSame('vaulx-bridge', $result['service']);
        $this->assertHmacValid();
    }

    public function test_read_loan_config_passes_through_decoded_fields(): void
    {
        Http::fake([
            self::BASE . '/chain/loan-config' => Http::response([
                'ok' => true,
                'data' => ['pda' => '5Th...', 'fields' => ['admin' => '2HY...']],
            ], 200),
        ]);

        $result = $this->bridge->readLoanConfig();

        $this->assertTrue($result['ok']);
        $this->assertSame('5Th...', $result['data']['pda']);
        $this->assertHmacValid();
    }

    public function test_read_vault_uses_asset_mint_in_url(): void
    {
        Http::fake([self::BASE . '/chain/vault/*' => Http::response(['ok' => true], 200)]);

        $this->bridge->readVault('3eXFpUHRtg7UdJviTtz9LP87LfGk2aYsPDfkjDFai672');

        Http::assertSent(fn (Request $r) =>
            $r->method() === 'GET'
            && str_contains($r->url(), '/chain/vault/3eXFpUHRtg7UdJviTtz9LP87LfGk2aYsPDfkjDFai672')
        );
        $this->assertHmacValid();
    }

    public function test_read_trdc_state_uses_loan_id_in_url(): void
    {
        Http::fake([self::BASE . '/chain/trdc-state/*' => Http::response(['ok' => true], 200)]);

        $this->bridge->readTrdcState('AbCdEfGhIjK');

        Http::assertSent(fn (Request $r) => str_contains($r->url(), '/chain/trdc-state/AbCdEfGhIjK'));
        $this->assertHmacValid();
    }

    public function test_read_account_uses_pda_in_url(): void
    {
        Http::fake([self::BASE . '/chain/account/*' => Http::response(['ok' => true], 200)]);

        $this->bridge->readAccount('5Thh');

        Http::assertSent(fn (Request $r) => str_contains($r->url(), '/chain/account/5Thh'));
        $this->assertHmacValid();
    }

    // ---------- Write endpoints (pre-wired) ----------

    public function test_deposit_to_vault_posts_correct_body(): void
    {
        Http::fake([
            self::BASE . '/chain/vault/deposit' => Http::response([
                'ok' => true, 'txSignature' => '5xyz',
            ], 200),
        ]);

        $result = $this->bridge->depositToVault('mint123', 1_000_000, 'depositor456');

        $this->assertTrue($result['ok']);
        $this->assertSame('5xyz', $result['txSignature']);
        Http::assertSent(function (Request $r) {
            if ($r->method() !== 'POST') {
                return false;
            }
            $body = json_decode((string) $r->body(), true);
            return $body === [
                'assetMint' => 'mint123',
                'amount' => 1_000_000,
                'depositor' => 'depositor456',
            ];
        });
        $this->assertHmacValid();
    }

    public function test_confirm_custody_and_disburse_posts_loan_id(): void
    {
        Http::fake([self::BASE . '/chain/loan/confirm-custody' => Http::response(['ok' => true, 'txSignature' => 'abc'], 200)]);

        $this->bridge->confirmCustodyAndDisburse('loan-1');

        Http::assertSent(fn (Request $r) =>
            json_decode((string) $r->body(), true) === ['loanId' => 'loan-1']
        );
        $this->assertHmacValid();
    }

    public function test_pay_installment_posts_loan_id_and_amount(): void
    {
        Http::fake([self::BASE . '/chain/loan/pay-installment' => Http::response(['ok' => true], 200)]);

        $this->bridge->payInstallment('loan-1', 500_000);

        Http::assertSent(fn (Request $r) =>
            json_decode((string) $r->body(), true) === ['loanId' => 'loan-1', 'amount' => 500_000]
        );
        $this->assertHmacValid();
    }

    public function test_renew_posts_loan_id_and_new_term_days(): void
    {
        Http::fake([self::BASE . '/chain/loan/renew' => Http::response(['ok' => true], 200)]);

        $this->bridge->renew('loan-1', 60);

        Http::assertSent(fn (Request $r) =>
            json_decode((string) $r->body(), true) === ['loanId' => 'loan-1', 'newTermDays' => 60]
        );
    }

    public function test_repay_posts_loan_id(): void
    {
        Http::fake([self::BASE . '/chain/loan/repay' => Http::response(['ok' => true], 200)]);

        $this->bridge->repay('loan-1');

        Http::assertSent(fn (Request $r) =>
            json_decode((string) $r->body(), true) === ['loanId' => 'loan-1']
        );
    }

    public function test_issue_sas_posts_owner_and_jwt_hash(): void
    {
        Http::fake([self::BASE . '/chain/sas/issue' => Http::response(['ok' => true], 200)]);

        $this->bridge->issueSAS('owner-pubkey', 'sha256-of-jwt');

        Http::assertSent(fn (Request $r) =>
            json_decode((string) $r->body(), true) === ['owner' => 'owner-pubkey', 'jwtHash' => 'sha256-of-jwt']
        );
    }

    public function test_execute_default_posts_loan_id(): void
    {
        Http::fake([self::BASE . '/chain/auction/execute-default' => Http::response(['ok' => true], 200)]);

        $this->bridge->executeDefault('loan-1');

        Http::assertSent(fn (Request $r) =>
            json_decode((string) $r->body(), true) === ['loanId' => 'loan-1']
        );
    }

    // ---------- Error paths ----------

    public function test_returns_normalized_error_on_404(): void
    {
        Http::fake([
            self::BASE . '/chain/health' => Http::response(
                ['ok' => false, 'error' => 'account_not_found'],
                404,
            ),
        ]);

        $result = $this->bridge->health();

        $this->assertFalse($result['ok']);
        $this->assertSame(404, $result['status']);
        $this->assertSame('account_not_found', $result['error']);
    }

    public function test_returns_normalized_error_on_500_without_ok_field(): void
    {
        Http::fake([
            self::BASE . '/chain/health' => Http::response(['error' => 'internal'], 500),
        ]);

        $result = $this->bridge->health();

        $this->assertFalse($result['ok']);
        $this->assertSame(500, $result['status']);
        $this->assertSame('internal', $result['error']);
    }

    public function test_returns_network_error_when_http_throws(): void
    {
        Http::fake(function () {
            throw new \Exception('simulated network failure');
        });

        $result = $this->bridge->health();

        $this->assertFalse($result['ok']);
        $this->assertSame('network_error', $result['error']);
        $this->assertSame(0, $result['status']);
    }

    public function test_short_circuits_without_http_when_secret_is_empty(): void
    {
        // Empty config (e.g. prod env without SOLANA_BRIDGE_SHARED_SECRET)
        // — service must NOT issue HTTP. `Http::fake()` records anything
        // that did go out; `assertNothingSent()` verifies the early-return
        // path took effect.
        Http::fake();
        $bridge = new SolanaBridge(self::BASE, '', 30);

        $result = $bridge->health();

        $this->assertFalse($result['ok']);
        $this->assertSame('bridge_not_configured', $result['error']);
        $this->assertSame(0, $result['status']);
        Http::assertNothingSent();
    }

    public function test_short_circuits_without_http_when_base_url_is_empty(): void
    {
        Http::fake();
        $bridge = new SolanaBridge('', self::SECRET, 30);

        $result = $bridge->readLoanConfig();

        $this->assertFalse($result['ok']);
        $this->assertSame('bridge_not_configured', $result['error']);
        Http::assertNothingSent();
    }

    public function test_passes_through_non_json_body_on_success(): void
    {
        Http::fake([
            self::BASE . '/chain/health' => Http::response('plain-text-not-json', 200),
        ]);

        $result = $this->bridge->health();

        $this->assertTrue($result['ok']);
        $this->assertSame(200, $result['status']);
        $this->assertSame('plain-text-not-json', $result['data']);
    }
}
