@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Admin Dashboard')
@section('page-subtitle', 'Protocol overview')

@push('scripts')
@vite(['resources/js/pages/admin-dashboard.js'])
@endpush

@section('panel-content')
{{-- Stats --}}
<div class="row g-3 mb-4">
    <div class="col-md-3">
        <div class="card stat-card p-3">
            <small class="text-muted">Users</small>
            <h3 class="fw-bold mb-0">{{ $stats['total_users'] }}</h3>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card stat-card accent p-3">
            <small class="text-muted">Active loans</small>
            <h3 class="fw-bold mb-0">{{ $stats['active_loans'] }}</h3>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card stat-card warning p-3">
            <small class="text-muted">Pending custody</small>
            <h3 class="fw-bold mb-0">{{ $stats['pending_custody'] }}</h3>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card stat-card danger p-3">
            <small class="text-muted">Overdue</small>
            <h3 class="fw-bold mb-0">{{ $stats['overdue_loans'] }}</h3>
        </div>
    </div>
</div>

<div class="row g-3 mb-4">
    <div class="col-md-3">
        <div class="card p-3">
            <small class="text-muted">Total lent</small>
            <h4 class="fw-bold mb-0">${{ number_format($stats['total_principal'], 2) }}</h4>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3">
            <small class="text-muted">Outstanding balance</small>
            <h4 class="fw-bold mb-0 text-danger">${{ number_format($stats['total_outstanding'], 2) }}</h4>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3">
            <small class="text-muted">Total received</small>
            <h4 class="fw-bold mb-0 text-success">${{ number_format($stats['total_repaid'], 2) }}</h4>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3">
            <small class="text-muted">Revenue (origination fees)</small>
            <h4 class="fw-bold mb-0" style="color:var(--gf-accent)">${{ number_format($stats['total_origination_fees'], 2) }}</h4>
        </div>
    </div>
</div>

{{-- On-chain snapshot — live read of the loan_config singleton + the demo asset's vault.
     Cache TTL is 10s server-side; failed reads degrade gracefully without crashing the dashboard. --}}
<div class="card p-4 mb-4" style="border-left:4px solid var(--vx-gold)">
    <div class="d-flex justify-content-between align-items-start mb-1">
        <h5 class="fw-bold mb-0">
            <i class="bi bi-link-45deg me-2" style="color:var(--vx-gold)"></i>On-chain snapshot
        </h5>
        <div class="d-flex align-items-center gap-2">
            <span class="badge bg-success" title="Live read from Solana devnet via the Vaulx bridge">
                {{ strtoupper(config('garantifi.network')) }} · LIVE
            </span>
            <small class="text-muted">refreshed {{ $onchain['fetched_at'] }}</small>
        </div>
    </div>
    <p class="text-muted small mb-3">
        Money cannot disburse without on-chain custody confirmation. Each gate below is enforced by the Anchor program — no admin override.
    </p>
    <div class="row g-3">
        <div class="col-md-6">
            @if ($onchain['loan_config']['ok'] ?? false)
                @php $cfg = $onchain['loan_config']['data']['fields'] ?? []; @endphp
                <h6 class="text-muted mb-2">Loan config</h6>
                <ul class="small list-unstyled mb-0">
                    <li><strong>Admin:</strong> <code>{{ \Illuminate\Support\Str::limit($cfg['admin'] ?? '', 16, '…') }}</code></li>
                    <li><strong>Custodian:</strong> <code>{{ \Illuminate\Support\Str::limit($cfg['custodian'] ?? '', 16, '…') }}</code></li>
                    <li><strong>KYC required:</strong> {{ ($cfg['kyc_required'] ?? false) ? 'yes' : 'no' }}</li>
                    <li><strong>Oracle:</strong>
                        @if (($cfg['oracle_admin'] ?? '') === '11111111111111111111111111111111')
                            <span class="badge bg-secondary">disabled</span>
                        @else
                            <code>{{ \Illuminate\Support\Str::limit($cfg['oracle_admin'] ?? '', 16, '…') }}</code>
                        @endif
                    </li>
                </ul>
            @else
                <div class="alert alert-warning small mb-0">
                    Bridge offline · loan_config: {{ $onchain['loan_config']['error'] ?? 'unknown error' }}
                </div>
            @endif
        </div>
        <div class="col-md-6">
            @if ($onchain['vault']['ok'] ?? false)
                @php $v = $onchain['vault']['data']['fields'] ?? []; @endphp
                <h6 class="text-muted mb-2">Vault <small class="text-muted">({{ \Illuminate\Support\Str::limit($onchain['asset_mint'], 12, '…') }})</small></h6>
                <ul class="small list-unstyled mb-0">
                    <li><strong>Total assets:</strong> {{ number_format(($v['total_assets'] ?? 0) / 1_000_000, 2) }} USDC</li>
                    <li><strong>Total shares:</strong> {{ number_format($v['total_shares'] ?? 0) }}</li>
                    <li><strong>Slot:</strong> {{ $onchain['vault']['data']['slot'] ?? '—' }}</li>
                </ul>
            @elseif (($onchain['vault']['status'] ?? 0) === 404)
                <div class="alert alert-info small mb-0">
                    Vault not initialized for the demo asset.
                    Run <code>scripts/dev/moment-1-e2e.ts</code> in <code>vaulx-protocol/</code> to bootstrap.
                </div>
            @else
                <div class="alert alert-warning small mb-0">
                    Bridge offline · vault: {{ $onchain['vault']['error'] ?? 'unknown error' }}
                </div>
            @endif
        </div>
    </div>
</div>

{{-- Loans by status chart --}}
@if(($stats['total_loans'] ?? 0) > 0)
<div class="card p-4 mb-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-pie-chart me-2" style="color:var(--vx-gold)"></i>Loans by status</h5>
    <div style="height:240px"><canvas id="loans-by-status"></canvas></div>
    <script type="application/json" id="loans-by-status-data">@json($loansByStatus ?? [])</script>
</div>
@endif

{{-- Pending Evaluation --}}
@if($pendingAssets->count())
<div class="card p-4 mb-4" style="border-left:4px solid var(--gf-primary)">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0"><i class="bi bi-clipboard-check me-2" style="color:var(--gf-primary)"></i>Assets Pending Evaluation ({{ $stats['pending_evaluation'] }})</h5>
        <a href="{{ route('admin.assets.pending') }}" class="btn btn-sm btn-outline-secondary">View all</a>
    </div>
    <div class="table-responsive">
        <table class="table align-middle">
            <thead><tr><th>Asset</th><th>Category</th><th>Requested value</th><th>Client</th><th>Submitted</th><th></th></tr></thead>
            <tbody>
            @foreach($pendingAssets as $asset)
                <tr>
                    <td><strong>{{ $asset->brand }} {{ $asset->model }}</strong></td>
                    <td><span class="badge bg-light text-dark">{{ $asset->category_label }}</span></td>
                    <td>${{ number_format($asset->estimated_value, 2) }}</td>
                    <td>{{ $asset->user->name }}</td>
                    <td>{{ $asset->created_at->format(config('app.date_format')) }}</td>
                    <td>
                        <a href="{{ route('admin.asset.evaluate', $asset) }}" class="btn btn-sm btn-gf">
                            <i class="bi bi-clipboard-check me-1"></i>Evaluate
                        </a>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</div>
@endif

{{-- Pending Custody --}}
@if($pendingLoans->count())
<div class="card p-4 mb-4" style="border-left:4px solid #f39c12">
    <h5 class="fw-bold mb-3"><i class="bi bi-hourglass-split me-2 text-warning"></i>Pending Custody ({{ $pendingLoans->count() }})</h5>
    <div class="table-responsive">
        <table class="table align-middle">
            <thead><tr><th>Code</th><th>Borrower</th><th>Asset</th><th>Principal</th><th>LTV</th><th>Requested</th><th></th></tr></thead>
            <tbody>
            @foreach($pendingLoans as $loan)
                <tr>
                    <td><strong>{{ $loan->code }}</strong></td>
                    <td>{{ $loan->user->name }}</td>
                    <td>{{ $loan->asset->brand }} {{ $loan->asset->model }}</td>
                    <td>${{ number_format($loan->principal, 2) }}</td>
                    <td>{{ $loan->ltv_percent }}%</td>
                    <td>{{ $loan->created_at->format(config('app.date_format')) }}</td>
                    <td>
                        <a href="{{ route('admin.loan.show', $loan) }}" class="btn btn-sm btn-outline-secondary me-1">View</a>
                        <form method="POST" action="{{ route('admin.loan.approve', $loan) }}" class="d-inline">
                            @csrf
                            <button class="btn btn-sm btn-success" onclick="return confirm('Approve custody and activate loan?')">
                                <i class="bi bi-check-lg"></i> Approve
                            </button>
                        </form>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</div>
@endif

{{-- Recent Loans --}}
<div class="card p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0"><i class="bi bi-clock-history me-2"></i>Recent Loans</h5>
        <a href="{{ route('admin.loans') }}" class="btn btn-sm btn-outline-secondary">View all</a>
    </div>
    <div class="table-responsive">
        <table class="table align-middle">
            <thead><tr><th>Code</th><th>Borrower</th><th>Asset</th><th>Principal</th><th>Status</th><th>Progress</th><th></th></tr></thead>
            <tbody>
            @foreach($recentLoans as $loan)
                <tr>
                    <td><strong>{{ $loan->code }}</strong></td>
                    <td>{{ $loan->user->name }}</td>
                    <td>{{ $loan->asset->brand }} {{ $loan->asset->model }}</td>
                    <td>${{ number_format($loan->principal, 2) }}</td>
                    <td><span class="badge bg-{{ $loan->status_color }}">{{ $loan->status_label }}</span></td>
                    <td>
                        <div class="progress" style="height:6px;width:80px">
                            <div class="progress-bar bg-success" style="width:{{ $loan->progress_percent }}%"></div>
                        </div>
                    </td>
                    <td><a href="{{ route('admin.loan.show', $loan) }}" class="btn btn-sm btn-outline-secondary">Details</a></td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
</div>
@endsection
