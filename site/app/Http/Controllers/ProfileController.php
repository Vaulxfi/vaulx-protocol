<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Support\Base58;

class ProfileController extends Controller
{
    public function show()
    {
        return view('profile');
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . auth()->id(),
            'phone' => 'nullable|string|max:20',
            'cpf_cnpj' => 'nullable|string|max:18',
            'wallet_address' => 'nullable|string|max:44',
        ]);

        auth()->user()->update($validated);

        return redirect()->route('profile.show')->with('success', 'Profile updated successfully.');
    }

    public function linkSolana(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nonce' => 'required|string|size:32',
            'pubkey' => 'required|string|min:32|max:44',
            'signature' => 'required|string|min:64|max:128',
        ]);

        $cached = Cache::pull("siws:nonce:{$data['nonce']}");
        if (!$cached) {
            return back()->with('error', 'Nonce expired. Try again.');
        }

        $b58 = new Base58();
        try {
            $pubkeyBytes = $b58->decode($data['pubkey']);
            $signatureBytes = $b58->decode($data['signature']);
        } catch (\Throwable $e) {
            return back()->with('error', 'Invalid base58 encoding.');
        }

        if (strlen($pubkeyBytes) !== 32 || strlen($signatureBytes) !== 64) {
            return back()->with('error', 'Invalid key or signature length.');
        }

        $domain = $request->getHost();
        $message = "vaulx.fi wants you to sign in with your Solana account.\n\n"
            . "Domain: {$domain}\n"
            . "Statement: Sign in to Vaulx.\n"
            . "Nonce: {$data['nonce']}\n"
            . "Issued At: {$cached['issued_at']}";

        if (!sodium_crypto_sign_verify_detached($signatureBytes, $message, $pubkeyBytes)) {
            return back()->with('error', 'Signature verification failed.');
        }

        $existing = \App\Models\User::where('solana_pubkey', $data['pubkey'])->first();
        if ($existing && $existing->id !== auth()->id()) {
            return back()->with('error', 'This Solana wallet is already linked to another account.');
        }

        auth()->user()->update([
            'solana_pubkey' => $data['pubkey'],
            'wallet_address' => $data['pubkey'],
        ]);

        return back()->with('success', 'Solana wallet linked to your account. You can now sign in with Solana.');
    }
}
