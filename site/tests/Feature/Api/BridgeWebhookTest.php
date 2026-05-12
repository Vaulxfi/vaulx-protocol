<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\OnchainEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BridgeWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-shared-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['solana_bridge.shared_secret' => self::SECRET]);
    }

    private function sign(string $ts, string $method, string $path, string $body): string
    {
        return hash_hmac('sha256', "{$ts}\n{$method}\n{$path}\n{$body}", self::SECRET);
    }

    private function postWebhook(string $event, array $payload, ?int $tsOverride = null, ?string $sigOverride = null): \Illuminate\Testing\TestResponse
    {
        $ts = (string) ($tsOverride ?? time());
        $body = json_encode($payload);
        $path = "/api/onchain-events/{$event}";
        $sig = $sigOverride ?? $this->sign($ts, 'POST', $path, $body);

        return $this->call(
            'POST',
            $path,
            [],
            [],
            [],
            [
                'HTTP_X-Vaulx-Timestamp' => $ts,
                'HTTP_X-Vaulx-Signature' => $sig,
                'CONTENT_TYPE' => 'application/json',
            ],
            $body,
        );
    }

    public function test_persists_event_on_valid_hmac(): void
    {
        $r = $this->postWebhook('custody-confirmed', [
            'program' => 'loan',
            'event' => 'CustodyConfirmed',
            'signature' => '5xyz' . str_repeat('a', 84),
            'slot' => 459_372_837,
            'data' => ['trdc_state' => 'Trdc1', 'doc_hash' => '00112233'],
        ]);

        $r->assertOk()->assertJson(['ok' => true]);
        $this->assertDatabaseHas('onchain_events', [
            'event_name' => 'custody-confirmed',
            'slot' => 459_372_837,
        ]);
        $row = OnchainEvent::first();
        $this->assertSame('loan', $row->program_id);
        $this->assertSame('5xyz' . str_repeat('a', 84), $row->signature);
        $this->assertIsArray($row->payload);
        $this->assertSame('CustodyConfirmed', $row->payload['event']);
    }

    public function test_idempotent_on_duplicate_signature_event_name_pair(): void
    {
        $sig = '7abc' . str_repeat('a', 84);
        $payload = [
            'program' => 'loan',
            'event' => 'CustodyConfirmed',
            'signature' => $sig,
            'slot' => 1,
            'data' => [],
        ];
        $this->postWebhook('custody-confirmed', $payload)->assertOk();
        $this->postWebhook('custody-confirmed', $payload)->assertOk();
        $this->assertSame(1, OnchainEvent::count());
    }

    public function test_allows_multiple_events_under_same_signature(): void
    {
        // Real Solana case: one tx fires events from multiple programs
        // (e.g. create_ccb_trdc emits CcbTrdcCreated + TrdcStateInitialized).
        $sig = '8def' . str_repeat('a', 84);
        $this->postWebhook('ccb-trdc-created', [
            'program' => 'loan',
            'event' => 'CcbTrdcCreated',
            'signature' => $sig,
            'slot' => 2,
            'data' => [],
        ])->assertOk();
        $this->postWebhook('trdc-state-initialized', [
            'program' => 'trdc',
            'event' => 'TrdcStateInitialized',
            'signature' => $sig,
            'slot' => 2,
            'data' => [],
        ])->assertOk();
        $this->assertSame(2, OnchainEvent::count());
    }

    public function test_rejects_missing_headers(): void
    {
        $r = $this->postJson('/api/onchain-events/custody-confirmed', ['program' => 'loan']);
        $r->assertStatus(401)->assertJson(['error' => 'missing_auth_headers']);
    }

    public function test_rejects_stale_timestamp(): void
    {
        $r = $this->postWebhook('custody-confirmed', ['program' => 'loan'], time() - 600);
        $r->assertStatus(401)->assertJson(['error' => 'stale_timestamp']);
    }

    public function test_rejects_bad_signature(): void
    {
        $r = $this->postWebhook(
            'custody-confirmed',
            ['program' => 'loan'],
            null,
            str_repeat('0', 64),
        );
        $r->assertStatus(401)->assertJson(['error' => 'bad_signature']);
    }

    public function test_rejects_unparseable_timestamp(): void
    {
        $r = $this->postWebhook(
            'custody-confirmed',
            ['program' => 'loan'],
        );
        // Stomp the ts header with a non-number
        $r = $this->call(
            'POST',
            '/api/onchain-events/custody-confirmed',
            [],
            [],
            [],
            [
                'HTTP_X-Vaulx-Timestamp' => 'not-a-number',
                'HTTP_X-Vaulx-Signature' => str_repeat('0', 64),
                'CONTENT_TYPE' => 'application/json',
            ],
            '{}',
        );
        $r->assertStatus(401)->assertJson(['error' => 'invalid_timestamp']);
    }

    public function test_rejects_invalid_event_name_slug(): void
    {
        $r = $this->postWebhook('NotKebabCase', ['program' => 'loan']);
        $r->assertStatus(400)->assertJson(['error' => 'invalid_event_name']);
    }

    public function test_returns_503_when_secret_unset(): void
    {
        config(['solana_bridge.shared_secret' => '']);
        $r = $this->postWebhook('custody-confirmed', ['program' => 'loan']);
        $r->assertStatus(503)->assertJson(['error' => 'bridge_not_configured']);
    }
}
