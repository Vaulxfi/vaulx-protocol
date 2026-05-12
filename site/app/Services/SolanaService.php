<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SolanaService
{
    public function rpc(string $method, array $params = []): mixed
    {
        try {
            $response = Http::timeout(8)->post(
                config('garantifi.rpc_url'),
                [
                    'jsonrpc' => '2.0',
                    'id' => uniqid('gf', true),
                    'method' => $method,
                    'params' => $params,
                ]
            );
            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['error'])) {
                    Log::warning('SolanaService RPC error', ['method' => $method, 'error' => $data['error']]);
                    return null;
                }
                return $data['result'] ?? null;
            }
        } catch (\Throwable $e) {
            Log::warning('SolanaService RPC exception', ['method' => $method, 'message' => $e->getMessage()]);
        }
        return null;
    }

    public function getBalance(string $address): ?float
    {
        $result = $this->rpc('getBalance', [$address]);
        if (is_array($result) && isset($result['value'])) {
            return (int) $result['value'] / 1e9;
        }
        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getTokenAccountBalance(string $tokenAccount): ?array
    {
        $result = $this->rpc('getTokenAccountBalance', [$tokenAccount]);
        return is_array($result) && isset($result['value']) && is_array($result['value'])
            ? $result['value']
            : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getSignaturesForAddress(string $address, int $limit = 20): array
    {
        $result = $this->rpc('getSignaturesForAddress', [$address, ['limit' => $limit]]);
        return is_array($result) ? $result : [];
    }

    public function getSlot(): ?int
    {
        $result = $this->rpc('getSlot');
        return is_numeric($result) ? (int) $result : null;
    }

    public function vaultSnapshot(string $tokenSymbol): array
    {
        $cacheKey = "gf:vault:{$tokenSymbol}";
        return Cache::remember($cacheKey, 60, function () use ($tokenSymbol) {
            $cfg = config("garantifi.tokens.{$tokenSymbol}");
            if (!$cfg) {
                return $this->emptyVault($tokenSymbol);
            }

            $programId = config('garantifi.programs.vault');
            $mint = $cfg['mint'];
            $derived = $programId ? $this->deriveVaultPda($programId, $mint) : null;

            $snap = $this->emptyVault($tokenSymbol);
            $snap['mint'] = $mint;
            $snap['pda'] = $derived;

            if ($derived) {
                $balance = $this->getTokenAccountBalance($derived);
                if ($balance) {
                    $snap['available'] = (float) ($balance['uiAmount'] ?? 0);
                    $snap['is_live'] = true;
                }
            }

            return $snap;
        });
    }

    public function deriveVaultPda(string $programId, string $mint): ?string
    {
        return null;
    }

    public function explorerUrl(string $type, string $value): string
    {
        $base = rtrim(config('garantifi.explorer_url'), '/');
        $cluster = config('garantifi.network') !== 'mainnet' ? '?cluster=' . config('garantifi.network') : '';
        return match ($type) {
            'tx' => "{$base}/tx/{$value}{$cluster}",
            'address' => "{$base}/address/{$value}{$cluster}",
            default => "{$base}/{$cluster}",
        };
    }

    protected function emptyVault(string $symbol): array
    {
        return [
            'symbol' => $symbol,
            'mint' => null,
            'pda' => null,
            'deposited' => 0.0,
            'lent' => 0.0,
            'available' => 0.0,
            'is_live' => false,
            'is_paused' => false,
        ];
    }
}
