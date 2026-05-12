<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Support\Base58;

class SiwsController extends Controller
{
    const NONCE_TTL = 300;

    protected Base58 $b58;

    public function __construct()
    {
        $this->b58 = new Base58();
    }

    public function challenge(Request $request): JsonResponse
    {
        $nonce = Str::random(32);
        $issuedAt = now()->toIso8601String();

        Cache::put($this->nonceKey($nonce), [
            'issued_at' => $issuedAt,
            'ip' => $request->ip(),
        ], self::NONCE_TTL);

        $domain = $request->getHost();
        $message = $this->buildMessage($domain, $nonce, $issuedAt);

        return response()->json([
            'nonce' => $nonce,
            'issued_at' => $issuedAt,
            'expires_in' => self::NONCE_TTL,
            'message' => $message,
            'domain' => $domain,
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nonce' => 'required|string|size:32',
            'pubkey' => 'required|string|min:32|max:44',
            'signature' => 'required|string|min:64|max:128',
        ]);

        $cached = Cache::pull($this->nonceKey($data['nonce']));
        if (!$cached) {
            return response()->json(['error' => 'invalid_or_expired_nonce'], 401);
        }

        try {
            $pubkeyBytes = $this->b58->decode($data['pubkey']);
            $signatureBytes = $this->b58->decode($data['signature']);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'invalid_base58'], 422);
        }

        if (strlen($pubkeyBytes) !== 32) {
            return response()->json(['error' => 'invalid_pubkey_length'], 422);
        }
        if (strlen($signatureBytes) !== 64) {
            return response()->json(['error' => 'invalid_signature_length'], 422);
        }

        $message = $this->buildMessage(
            $request->getHost(),
            $data['nonce'],
            $cached['issued_at']
        );

        $ok = sodium_crypto_sign_verify_detached(
            $signatureBytes,
            $message,
            $pubkeyBytes
        );
        if (!$ok) {
            return response()->json(['error' => 'invalid_signature'], 401);
        }

        $user = User::where('solana_pubkey', $data['pubkey'])->first();
        $created = false;
        if (!$user) {
            $user = User::create([
                'name' => 'Solana user ' . substr($data['pubkey'], 0, 4) . '…' . substr($data['pubkey'], -4),
                'email' => $data['pubkey'] . '@siws.vaulx.local',
                'password' => Hash::make(Str::random(48)),
                'role' => 'borrower',
                'wallet_address' => $data['pubkey'],
                'solana_pubkey' => $data['pubkey'],
                'auth_provider' => 'solana',
            ]);
            $created = true;
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return response()->json([
            'ok' => true,
            'created' => $created,
            'redirect' => $user->isAdmin() ? route('admin.dashboard') : route('borrower.dashboard'),
        ]);
    }

    protected function nonceKey(string $nonce): string
    {
        return "siws:nonce:{$nonce}";
    }

    protected function buildMessage(string $domain, string $nonce, string $issuedAt): string
    {
        return "vaulx.fi wants you to sign in with your Solana account.\n\n"
            . "Domain: {$domain}\n"
            . "Statement: Sign in to Vaulx.\n"
            . "Nonce: {$nonce}\n"
            . "Issued At: {$issuedAt}";
    }
}
