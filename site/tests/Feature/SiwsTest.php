<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use StephenHill\Base58;

uses(RefreshDatabase::class);

it('GET /auth/siws/challenge returns a formatted SIWS message', function () {
    $response = $this->getJson('/auth/siws/challenge');
    $response->assertOk();
    $response->assertJsonStructure(['nonce', 'issued_at', 'expires_in', 'message', 'domain']);
    $data = $response->json();
    expect(strlen($data['nonce']))->toBe(32);
    expect($data['message'])->toContain('vaulx.fi wants you to sign in')
        ->and($data['message'])->toContain('Nonce: ' . $data['nonce']);
});

it('POST /auth/siws/verify rejects invalid nonce', function () {
    $response = $this->postJson('/auth/siws/verify', [
        'nonce' => str_repeat('a', 32),
        'pubkey' => '11111111111111111111111111111111',
        'signature' => str_repeat('1', 88),
    ]);
    $response->assertStatus(401);
    $response->assertJsonPath('error', 'invalid_or_expired_nonce');
});

it('POST /auth/siws/verify rejects malformed base58', function () {
    $challenge = $this->getJson('/auth/siws/challenge')->json();
    $response = $this->postJson('/auth/siws/verify', [
        'nonce' => $challenge['nonce'],
        'pubkey' => '0OIL!!!invalid',
        'signature' => '0OIL!!!invalid',
    ]);
    $response->assertStatus(422);
});

it('POST /auth/siws/verify validates full ed25519 signature flow', function () {
    $keyPair = sodium_crypto_sign_keypair();
    $publicKey = sodium_crypto_sign_publickey($keyPair);
    $secretKey = sodium_crypto_sign_secretkey($keyPair);
    $b58 = new Base58();
    $pubkeyB58 = $b58->encode($publicKey);

    $challenge = $this->getJson('/auth/siws/challenge')->json();
    $signatureBytes = sodium_crypto_sign_detached($challenge['message'], $secretKey);
    $signatureB58 = $b58->encode($signatureBytes);

    $response = $this->postJson('/auth/siws/verify', [
        'nonce' => $challenge['nonce'],
        'pubkey' => $pubkeyB58,
        'signature' => $signatureB58,
    ]);

    $response->assertOk();
    $response->assertJsonPath('ok', true);
    $response->assertJsonPath('created', true);

    expect(User::where('solana_pubkey', $pubkeyB58)->exists())->toBeTrue();
});

it('nonce is single-use (replay attack prevented)', function () {
    $keyPair = sodium_crypto_sign_keypair();
    $publicKey = sodium_crypto_sign_publickey($keyPair);
    $secretKey = sodium_crypto_sign_secretkey($keyPair);
    $b58 = new Base58();
    $pubkeyB58 = $b58->encode($publicKey);

    $challenge = $this->getJson('/auth/siws/challenge')->json();
    $signatureBytes = sodium_crypto_sign_detached($challenge['message'], $secretKey);
    $signatureB58 = $b58->encode($signatureBytes);

    // First call: success
    $this->postJson('/auth/siws/verify', [
        'nonce' => $challenge['nonce'],
        'pubkey' => $pubkeyB58,
        'signature' => $signatureB58,
    ])->assertOk();

    // Logout to reset the auth state
    auth()->logout();

    // Second call: nonce already consumed
    $replay = $this->postJson('/auth/siws/verify', [
        'nonce' => $challenge['nonce'],
        'pubkey' => $pubkeyB58,
        'signature' => $signatureB58,
    ]);
    $replay->assertStatus(401);
    $replay->assertJsonPath('error', 'invalid_or_expired_nonce');
});
