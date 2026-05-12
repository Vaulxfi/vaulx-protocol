<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * HMAC-signed HTTP client for the Solana Bridge service.
 *
 * Mirrors the bridge's `createHmacMiddleware` (vaulx-protocol/apps/bridge/
 * src/http/hmac.ts): every request carries `X-Vaulx-Timestamp` +
 * `X-Vaulx-Signature` headers, computed over the canonical payload
 *
 *   `${timestamp}\n${METHOD}\n${path}\n${rawBody}`
 *
 * with `SOLANA_BRIDGE_SHARED_SECRET` as the key. `path` is the URL pathname
 * including any subpath in `base_url` so the bridge sees the same string
 * in `req.originalUrl`.
 *
 * Methods never throw — they return a normalized array
 *
 *   ['ok' => bool, 'status' => int, 'data'? => array, 'error'? => string,
 *    'txSignature'? => string, ...passthrough fields from bridge]
 *
 * Controllers decide whether to surface an error to the user. Network
 * failures retry once via Http::retry(2, 500ms) before bailing out as
 * 'network_error'. Read endpoints (health, readLoanConfig, readVault,
 * readTrdcState, readAccount) work today; write endpoints are pre-wired
 * with the spec shape and will return 404 from the bridge until the
 * corresponding endpoints land alongside the atomic confirm-and-disburse
 * write phase.
 */
class SolanaBridge
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $sharedSecret,
        private readonly int $timeoutSeconds = 30,
    ) {
    }

    // ---------------------------------------------------------------------
    // Read endpoints — work today against the live bridge.
    // ---------------------------------------------------------------------

    public function health(): array
    {
        return $this->send('GET', '/chain/health', null);
    }

    public function readLoanConfig(): array
    {
        return $this->send('GET', '/chain/loan-config', null);
    }

    public function readVault(string $assetMint): array
    {
        return $this->send(
            'GET',
            '/chain/vault/' . rawurlencode($assetMint),
            null,
        );
    }

    public function readTrdcState(string $loanId): array
    {
        return $this->send(
            'GET',
            '/chain/trdc-state/' . rawurlencode($loanId),
            null,
        );
    }

    public function readAccount(string $pda): array
    {
        return $this->send(
            'GET',
            '/chain/account/' . rawurlencode($pda),
            null,
        );
    }

    // ---------------------------------------------------------------------
    // Write endpoints — pre-wired with the spec shape. Bridge will 404
    // these until the write phase lands; the call sites in Laravel can
    // start integrating against this service today, and the moment the
    // bridge ships the endpoint the call is wired end-to-end without any
    // change here.
    // ---------------------------------------------------------------------

    public function depositToVault(
        string $assetMint,
        int $amountAtoms,
        string $depositor,
    ): array {
        return $this->send('POST', '/chain/vault/deposit', [
            'assetMint' => $assetMint,
            'amount' => $amountAtoms,
            'depositor' => $depositor,
        ]);
    }

    public function confirmCustodyAndDisburse(string $loanId): array
    {
        return $this->send('POST', '/chain/loan/confirm-custody', [
            'loanId' => $loanId,
        ]);
    }

    /**
     * Mint a fresh on-chain `trdc_state` PDA for a borrower-requested loan.
     *
     * Call this from `BorrowerController::storeLoan` right after the
     * Laravel-side row is persisted, then store the returned `loanId` on
     * the row as `solana_loan_id`. Without this step the eventual
     * `confirmCustodyAndDisburse` would error with `trdc_state_not_found`.
     *
     * Atoms (u64) are passed as strings to dodge the JS Number 2^53 cap on
     * the bridge end — the bridge's parsePositiveBigInt accepts both, and
     * the string form is unambiguous for any USDC amount we'd actually mint.
     *
     * Response shape on success:
     *   ['ok' => true, 'txSignature' => '<base58>', 'loanId' => '<base58>',
     *    'accounts' => [...], 'executed' => true]
     *
     * On failure: same normalized `{ok: false, status, error}` envelope as
     * every other write — caller decides whether to surface, retry, or
     * block its own state transition.
     */
    public function createCcbTrdc(
        int $appraisalAtoms,
        int $loanAmountAtoms,
        int $termDays,
        int $rateBps,
    ): array {
        return $this->send('POST', '/chain/loan/create-ccb-trdc', [
            'appraisalAtoms' => (string) $appraisalAtoms,
            'loanAmountAtoms' => (string) $loanAmountAtoms,
            'termDays' => $termDays,
            'rateBps' => $rateBps,
        ]);
    }

    public function payInstallment(string $loanId, int $amountAtoms): array
    {
        return $this->send('POST', '/chain/loan/pay-installment', [
            'loanId' => $loanId,
            'amount' => $amountAtoms,
        ]);
    }

    public function renew(string $loanId, int $newTermDays): array
    {
        return $this->send('POST', '/chain/loan/renew', [
            'loanId' => $loanId,
            'newTermDays' => $newTermDays,
        ]);
    }

    public function repay(string $loanId): array
    {
        return $this->send('POST', '/chain/loan/repay', [
            'loanId' => $loanId,
        ]);
    }

    public function issueSAS(string $owner, string $jwtHash): array
    {
        return $this->send('POST', '/chain/sas/issue', [
            'owner' => $owner,
            'jwtHash' => $jwtHash,
        ]);
    }

    public function executeDefault(string $loanId): array
    {
        return $this->send('POST', '/chain/auction/execute-default', [
            'loanId' => $loanId,
        ]);
    }

    // ---------------------------------------------------------------------
    // Internal: HMAC signing + Http transport.
    // ---------------------------------------------------------------------

    /**
     * @param  array<string, mixed>|null  $payload
     * @return array<string, mixed>
     */
    private function send(string $method, string $path, ?array $payload): array
    {
        // Short-circuit when the bridge isn't configured (e.g. local dev or
        // a prod env where the bridge service isn't deployed yet). Skips
        // HTTP entirely so callers don't eat a 30s timeout on every page
        // load. Views already render "Bridge offline" copy on `ok:false`.
        if ($this->sharedSecret === '' || $this->baseUrl === '') {
            return [
                'ok' => false,
                'error' => 'bridge_not_configured',
                'status' => 0,
            ];
        }

        $ts = time();
        if ($payload === null) {
            $body = '';
        } else {
            $encoded = json_encode($payload, JSON_UNESCAPED_SLASHES);
            if ($encoded === false) {
                Log::warning('SolanaBridge json_encode failed', [
                    'method' => $method,
                    'path' => $path,
                    'last_error' => json_last_error_msg(),
                ]);
                return ['ok' => false, 'error' => 'json_encode_failed', 'status' => 0];
            }
            $body = $encoded;
        }

        $url = rtrim($this->baseUrl, '/') . $path;
        // Path component the bridge will see in `req.originalUrl`.
        // Preserves any subpath in `baseUrl` so a Laravel-side mismatch on
        // base URL doesn't desync the HMAC.
        $signedPath = parse_url($url, PHP_URL_PATH) ?: $path;

        $sig = hash_hmac(
            'sha256',
            "{$ts}\n{$method}\n{$signedPath}\n{$body}",
            $this->sharedSecret,
        );

        try {
            // Laravel 8's HTTP client invokes `$response->throw()` on 4xx/5xx
            // when `tries > 1`, converting bridge "ok:false" responses into
            // RequestExceptions inside the retry wrapper. We pass an explicit
            // `$when` callback that only retries on actual ConnectionException
            // (network-level failure) — RequestException (4xx/5xx) propagates
            // immediately and we recover the original Response below.
            $request = Http::timeout($this->timeoutSeconds)
                ->retry(2, 500, fn (Throwable $e) => $e instanceof ConnectionException)
                ->withHeaders([
                    'X-Vaulx-Timestamp' => (string) $ts,
                    'X-Vaulx-Signature' => $sig,
                    'Content-Type' => 'application/json',
                ]);

            if ($body !== '') {
                $request = $request->withBody($body, 'application/json');
            }

            return $this->normalizeResponse($request->send($method, $url));
        } catch (RequestException $e) {
            // 4xx/5xx — retry's `$when` returned false, the exception
            // propagated. Recover the original Response so callers see the
            // actual status code + bridge-side error fields.
            return $this->normalizeResponse($e->response);
        } catch (Throwable $e) {
            Log::warning('SolanaBridge HTTP exception', [
                'method' => $method,
                'path' => $path,
                'message' => $e->getMessage(),
            ]);
            return ['ok' => false, 'error' => 'network_error', 'status' => 0];
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeResponse(Response $response): array
    {
        $status = $response->status();
        $json = $response->json();

        if (!is_array($json)) {
            // Bridge always returns JSON, but defend against intermediaries
            // (proxies, error pages) that don't.
            return [
                'ok' => $response->successful(),
                'status' => $status,
                'data' => $response->body(),
            ];
        }

        // Normalize: ensure `ok` exists. Bridge sets it on every route, but
        // a non-bridge 4xx/5xx page wouldn't.
        return array_merge(
            ['ok' => $response->successful(), 'status' => $status],
            $json,
        );
    }
}
