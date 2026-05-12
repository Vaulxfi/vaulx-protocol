@extends('layouts.panel')
@section('sidebar') @include('borrower.sidebar') @endsection
@section('page-title', 'Dashboard')
@section('page-subtitle', 'Overview of your assets and loans')
@section('page-actions')
    <a href="{{ route('borrower.asset.create') }}" class="btn btn-gf btn-sm"><i class="bi bi-plus-lg me-1"></i>New Asset</a>
@endsection

@section('panel-content')
@include('borrower.onboarding')

{{-- "What's happening" — top-of-dashboard transparency card.
     Renders only when there are assets in motion (waiting/action/warning).
     Skips assets in final/done state — those live in the table below. --}}
<x-asset-progress-card :assets="$assets" />

{{-- Re-loan eligible assets --}}
@php $reloanAssets = $assets->filter(fn($a) => \App\Models\Loan::reloanEligible($a)); @endphp
@if($reloanAssets->isNotEmpty())
    <div class="card card-accent accent p-4 mb-4">
        <h5 class="fw-bold mb-3"><i class="bi bi-lightning-fill me-2 text-amber"></i>Re-loan ready</h5>
        @foreach($reloanAssets as $asset)
            <div class="d-flex justify-content-between align-items-center p-3 rounded mb-2" style="background:var(--vx-surface-2);border:1px solid var(--vx-border)">
                <div>
                    <strong>{{ $asset->brand }} {{ $asset->model }}</strong>
                    <small class="text-muted d-block">Appraised <x-money :amount="$asset->appraised_value" /> on {{ optional($asset->appraisal_date)->format(config('app.date_format')) }} · skip evaluator queue</small>
                </div>
                <a href="{{ route('borrower.reloan.show', $asset) }}" class="btn btn-gf-accent btn-sm">
                    <i class="bi bi-arrow-clockwise me-1"></i>Re-loan
                </a>
            </div>
        @endforeach
    </div>
@endif

{{-- Pending evaluation decisions --}}
@if(isset($pendingDecisions) && $pendingDecisions->count())
    <div class="card card-accent warning p-4 mb-4">
        <h5 class="fw-bold mb-3"><i class="bi bi-hourglass-split me-2" style="color:var(--vx-amber)"></i>Evaluation range ready — your decision needed</h5>
        @foreach($pendingDecisions as $ev)
            <div class="d-flex justify-content-between align-items-center p-3 rounded mb-2" style="background:var(--vx-surface-2);border:1px solid var(--vx-border)">
                <div>
                    <strong>{{ $ev->asset->brand }} {{ $ev->asset->model }}</strong>
                    <small class="text-muted d-block">Range: <x-money :amount="$ev->range_min" /> — <x-money :amount="$ev->range_max" /></small>
                </div>
                <a href="{{ route('evaluation.range', $ev->asset) }}" class="btn btn-gf-accent btn-sm">Review & decide</a>
            </div>
        @endforeach
    </div>
@endif

{{-- Stats --}}
<div class="row g-3 mb-4">
    <div class="col-md-3">
        <div class="card stat-card p-3">
            <small class="text-muted">Registered assets</small>
            <h3 class="fw-bold mb-0">{{ $stats['total_assets'] }}</h3>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card stat-card accent p-3">
            <small class="text-muted">Active loans</small>
            <h3 class="fw-bold mb-0">{{ $stats['active_loans'] }}</h3>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card stat-card p-3">
            <small class="text-muted">Total borrowed</small>
            <h3 class="fw-bold mb-0">${{ number_format($stats['total_borrowed'], 2) }}</h3>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card stat-card warning p-3">
            <small class="text-muted">Outstanding balance</small>
            <h3 class="fw-bold mb-0">${{ number_format($stats['outstanding'], 2) }}</h3>
        </div>
    </div>
</div>

{{-- Assets --}}
<div class="card p-4 mb-4" id="assets">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0"><i class="bi bi-box-seam me-2"></i>My Assets</h5>
        <a href="{{ route('borrower.asset.create') }}" class="btn btn-gf-accent btn-sm">Register Asset</a>
    </div>
    @if($assets->isEmpty())
        <x-empty-state
            icon="box-seam"
            title="No assets registered"
            description="Register your first asset to unlock credit. Allowed: watches, jewelry, art, vehicles."
            action-label="Register your first asset"
            :action-url="route('borrower.asset.create')" />
    @else
        <div class="table-responsive">
            <table class="table align-middle">
                <thead><tr><th>Asset</th><th>Category</th><th>Requested value</th><th>Appraised value</th><th>Status</th><th></th></tr></thead>
                <tbody>
                @foreach($assets as $asset)
                    <tr>
                        <td>
                            <strong>{{ $asset->brand }} {{ $asset->model }}</strong>
                            @if($asset->serial_number)<br><small class="text-muted">S/N: {{ $asset->serial_number }}</small>@endif
                        </td>
                        <td><span class="badge bg-light text-dark">{{ $asset->category_label }}</span></td>
                        <td>${{ number_format($asset->estimated_value, 2) }}</td>
                        <td>
                            @if($asset->appraised_value)
                                <strong style="color:var(--gf-accent)">${{ number_format($asset->appraised_value, 2) }}</strong>
                            @else
                                <span class="text-muted">—</span>
                            @endif
                        </td>
                        <td>
                            <span class="badge bg-{{ $asset->custody_status_color }}">{{ $asset->custody_status_label }}</span>
                            <x-asset-next-step :asset="$asset" />
                        </td>
                        <td>
                            <a href="{{ route('borrower.asset.show', $asset) }}" class="btn btn-sm btn-outline-secondary me-1">View</a>
                            @if($asset->isAvailableForLoan())
                                <a href="{{ route('borrower.loan.request') }}" class="btn btn-sm btn-gf">Request Loan</a>
                            @endif
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
</div>

{{-- Recent Loans --}}
<div class="card p-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-cash-coin me-2"></i>Recent Loans</h5>
    @if($loans->isEmpty())
        <x-empty-state icon="cash-coin" title="No loans yet" description="Your loans will appear here once you request credit." />
    @else
        <div class="table-responsive">
            <table class="table align-middle">
                <thead><tr><th>Code</th><th>Asset</th><th>Principal</th><th>Currency</th><th>Status</th><th>Progress</th><th></th></tr></thead>
                <tbody>
                @foreach($loans->take(5) as $loan)
                    <tr>
                        <td><strong>{{ $loan->code }}</strong></td>
                        <td>{{ $loan->asset->brand }} {{ $loan->asset->model }}</td>
                        <td>{{ $loan->formatAmount($loan->principal) }}</td>
                        <td><span class="badge bg-light text-dark">{{ $loan->currency }}</span></td>
                        <td><span class="badge bg-{{ $loan->status_color }}">{{ $loan->status_label }}</span></td>
                        <td>
                            <div class="progress" style="height:6px;width:100px">
                                <div class="progress-bar bg-success" style="width:{{ $loan->progress_percent }}%"></div>
                            </div>
                            <small class="text-muted">{{ $loan->progress_percent }}%</small>
                        </td>
                        <td><a href="{{ route('borrower.loan.show', $loan) }}" class="btn btn-sm btn-outline-secondary">Details</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
</div>
@endsection
