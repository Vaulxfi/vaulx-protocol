@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Multisig')
@section('page-subtitle', 'Squads Protocol — on-chain governance keyset')

@php
    $cluster = $multisig['cluster'] ?? 'devnet';
    $clusterQuery = $cluster === 'mainnet-beta' ? '' : "?cluster={$cluster}";
    $explorerAddr = fn ($pk) => "https://explorer.solana.com/address/{$pk}{$clusterQuery}";
    $explorerTx = fn ($sig) => "https://explorer.solana.com/tx/{$sig}{$clusterQuery}";
    $shortPk = fn ($pk) => substr($pk, 0, 6) . '…' . substr($pk, -4);
    $createdLabel = !empty($multisig['created_at'])
        ? \Carbon\Carbon::parse($multisig['created_at'])->format('M j, Y')
        : null;
    $threshold = (int) ($multisig['threshold'] ?? 2);
    $totalMembers = count($multisig['members'] ?? []);
@endphp

@section('panel-content')
{{-- Multisig identity --}}
<div class="card p-4 mb-4">
    <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
            <h5 class="fw-bold mb-1">
                <i class="bi bi-shield-lock me-2" style="color:var(--gf-primary)"></i>
                Squads Protocol — Multisig {{ $threshold }}/{{ $totalMembers }}
            </h5>
            <p class="text-muted mb-0">Governance keyset deployed on {{ ucfirst($cluster) }}. Sensitive instructions require {{ $threshold }} of {{ $totalMembers }} member signatures.</p>
        </div>
        <span class="badge bg-success px-2 py-1"><i class="bi bi-broadcast me-1"></i>{{ strtoupper($cluster) }} · LIVE</span>
    </div>

    <hr>

    <div class="row g-3 small">
        <div class="col-md-6">
            <div class="text-muted text-uppercase mb-1" style="font-size:.7rem;letter-spacing:.05em">Multisig PDA</div>
            <div class="d-flex align-items-center">
                <code class="me-2" style="font-size:.85rem;color:var(--gf-primary)">{{ $multisig['multisig_pda'] }}</code>
                <a href="{{ $explorerAddr($multisig['multisig_pda']) }}" target="_blank" rel="noopener" class="text-muted" title="View on Solana Explorer">
                    <i class="bi bi-box-arrow-up-right"></i>
                </a>
            </div>
        </div>
        <div class="col-md-6">
            <div class="text-muted text-uppercase mb-1" style="font-size:.7rem;letter-spacing:.05em">Vault PDA (treasury)</div>
            <div class="d-flex align-items-center">
                <code class="me-2" style="font-size:.85rem;color:var(--gf-primary)">{{ $multisig['vault_pda'] }}</code>
                <a href="{{ $explorerAddr($multisig['vault_pda']) }}" target="_blank" rel="noopener" class="text-muted" title="View on Solana Explorer">
                    <i class="bi bi-box-arrow-up-right"></i>
                </a>
            </div>
        </div>
        @if ($createdLabel)
        <div class="col-md-6">
            <div class="text-muted text-uppercase mb-1" style="font-size:.7rem;letter-spacing:.05em">Initialized</div>
            <div>{{ $createdLabel }}</div>
        </div>
        @endif
        @if (!empty($multisig['creation_tx']))
        <div class="col-md-6">
            <div class="text-muted text-uppercase mb-1" style="font-size:.7rem;letter-spacing:.05em">Creation TX</div>
            <a href="{{ $explorerTx($multisig['creation_tx']) }}" target="_blank" rel="noopener" class="text-decoration-none">
                <code style="font-size:.8rem">{{ $shortPk($multisig['creation_tx']) }}</code>
                <i class="bi bi-box-arrow-up-right ms-1 text-muted"></i>
            </a>
        </div>
        @endif
    </div>
</div>

{{-- Members --}}
<div class="card p-4 mb-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-people-fill me-2" style="color:var(--gf-primary)"></i>Members ({{ $totalMembers }})</h5>

    <div class="d-flex flex-column gap-3">
        @foreach ($multisig['members'] as $i => $member)
        <div class="d-flex align-items-center p-3 rounded" style="background:#f8f9fc;border:1px solid #e9ecef">
            <div style="width:40px;height:40px;border-radius:10px;background:var(--gf-primary);display:flex;align-items:center;justify-content:center" class="me-3 flex-shrink-0">
                <i class="bi {{ $member['icon'] ?? 'bi-key-fill' }} text-white"></i>
            </div>
            <div class="flex-grow-1" style="min-width:0">
                <div class="d-flex align-items-center flex-wrap">
                    <strong>Key {{ $i + 1 }}</strong>
                    <span class="text-muted mx-2">—</span>
                    <span>{{ $member['label'] }}</span>
                    <span class="text-muted mx-2">·</span>
                    <small class="text-muted">{{ $member['role'] }}</small>
                </div>
                <div class="d-flex align-items-center mt-1 flex-wrap">
                    <small class="text-muted me-3"><i class="bi bi-hdd-network me-1"></i>{{ $member['wallet_type'] }}</small>
                    <a href="{{ $explorerAddr($member['pubkey']) }}" target="_blank" rel="noopener" class="me-2 text-decoration-none">
                        <code style="font-size:.8rem;color:var(--gf-primary)">{{ $shortPk($member['pubkey']) }}</code>
                        <i class="bi bi-box-arrow-up-right ms-1 text-muted" style="font-size:.7rem"></i>
                    </a>
                    <span class="badge bg-light text-dark" style="font-size:.7rem">propose · approve · execute</span>
                </div>
            </div>
        </div>
        @endforeach
    </div>
</div>

{{-- Authority Levels (target governance) --}}
<div class="card p-4 mb-4">
    <div class="d-flex justify-content-between align-items-start mb-3">
        <h5 class="fw-bold mb-0"><i class="bi bi-diagram-3 me-2" style="color:var(--gf-primary)"></i>Authority Map</h5>
        <span class="badge bg-warning text-dark px-2 py-1"><i class="bi bi-exclamation-triangle me-1"></i>Target governance</span>
    </div>
    <p class="text-muted small mb-3">Routing of program authorities to the multisig above. Some flows are already gated; others are scoped for the post-hackathon hardening pass.</p>
    <div class="table-responsive">
        <table class="table align-middle mb-0">
            <thead><tr><th>Instruction</th><th>Authority</th><th>Status</th></tr></thead>
            <tbody>
                <tr>
                    <td><code>confirm_custody</code></td>
                    <td>Custody node (delegated)</td>
                    <td><span class="badge bg-success px-2 py-1">Live</span></td>
                </tr>
                <tr>
                    <td><code>disburse_loan</code></td>
                    <td>Vault authority (operator)</td>
                    <td><span class="badge bg-success px-2 py-1">Live</span></td>
                </tr>
                <tr>
                    <td><code>deposit_capital</code></td>
                    <td>Permissionless (lender wallet)</td>
                    <td><span class="badge bg-success px-2 py-1">Live</span></td>
                </tr>
                <tr>
                    <td><code>withdraw_liquidity</code></td>
                    <td>Squads {{ $threshold }}/{{ $totalMembers }}</td>
                    <td><span class="badge bg-secondary px-2 py-1">Roadmap</span></td>
                </tr>
                <tr>
                    <td><code>execute_default</code></td>
                    <td>Squads {{ $threshold }}/{{ $totalMembers }}</td>
                    <td><span class="badge bg-secondary px-2 py-1">Roadmap</span></td>
                </tr>
                <tr>
                    <td><code>pause_vault</code></td>
                    <td>Squads {{ $threshold }}/{{ $totalMembers }}</td>
                    <td><span class="badge bg-secondary px-2 py-1">Roadmap</span></td>
                </tr>
                <tr>
                    <td><code>mark_overdue</code></td>
                    <td>Backend bot (1/1)</td>
                    <td><span class="badge bg-secondary px-2 py-1">Bot</span></td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
@endsection
