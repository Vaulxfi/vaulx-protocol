@extends('layouts.panel')
@section('sidebar') @include('borrower.sidebar') @endsection
@section('page-title', $asset->brand . ' ' . $asset->model)
@section('page-subtitle', $asset->category_label)
@section('page-actions')
    @if($asset->isAvailableForLoan())
        <a href="{{ route('borrower.loan.request') }}" class="btn btn-gf btn-sm"><i class="bi bi-cash-coin me-1"></i>Request Loan</a>
    @endif
@endsection

@section('panel-content')

{{-- Journey/timeline — full transparency on where the asset is and what's next --}}
<x-asset-journey :asset="$asset" />

<div class="row g-4">
    <div class="col-lg-8">
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3">Asset Information</h6>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Category</small>
                    <strong>{{ $asset->category_label }}</strong>
                </div>
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Condition</small>
                    <strong>{{ ucfirst($asset->condition) }}</strong>
                </div>
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Brand / Model</small>
                    <strong>{{ $asset->brand }} {{ $asset->model }}</strong>
                </div>
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Serial Number</small>
                    <strong>{{ $asset->serial_number ?: '-' }}</strong>
                </div>
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Year</small>
                    <strong>{{ $asset->year ?: '-' }}</strong>
                </div>
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Custody</small>
                    <span class="badge bg-{{ $asset->custody_status_color }}">{{ $asset->custody_status_label }}</span>
                </div>
            </div>
            <div class="mb-0">
                <small class="text-muted d-block">Description</small>
                <p class="mb-0">{{ $asset->description }}</p>
            </div>
        </div>

        {{-- Photos --}}
        @if($asset->photo_urls && count($asset->photo_urls))
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-camera me-1"></i>Photos ({{ count($asset->photo_urls) }})</h6>
            <div class="row g-2">
                @foreach($asset->photo_urls as $url)
                    <div class="col-md-4 col-6">
                        <a href="{{ $url }}" target="_blank">
                            <img src="{{ $url }}" class="img-fluid rounded" style="width:100%;height:160px;object-fit:cover" alt="Asset photo">
                        </a>
                    </div>
                @endforeach
            </div>
        </div>
        @endif

        {{-- Loan history --}}
        <div class="card p-4">
            <h6 class="fw-bold mb-3">Loan History</h6>
            @if($asset->loans->isEmpty())
                <p class="text-muted text-center">No loans for this asset.</p>
            @else
                <table class="table table-sm">
                    <thead><tr><th>Code</th><th>Principal</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                    @foreach($asset->loans as $loan)
                        <tr>
                            <td><a href="{{ route('borrower.loan.show', $loan) }}">{{ $loan->code }}</a></td>
                            <td>${{ number_format($loan->principal, 2) }}</td>
                            <td><span class="badge bg-{{ $loan->status_color }}">{{ $loan->status_label }}</span></td>
                            <td>{{ $loan->created_at->format('m/d/Y') }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>

    <div class="col-lg-4">
        <div class="card p-4 mb-4" style="border-left:4px solid var(--gf-accent)">
            <h6 class="fw-bold mb-3">Appraisal</h6>
            <small class="text-muted d-block">Estimated value</small>
            <h4 class="fw-bold">${{ number_format($asset->estimated_value, 2) }}</h4>
            @if($asset->appraised_value)
                <small class="text-muted d-block mt-2">Appraised value</small>
                <h5 class="fw-bold" style="color:var(--gf-accent)">${{ number_format($asset->appraised_value, 2) }}</h5>
                <small class="text-muted">by {{ $asset->appraiser }} on {{ $asset->appraisal_date->format('m/d/Y') }}</small>
            @endif
        </div>

        <div class="card p-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-link-45deg me-1"></i>Solana</h6>
            <p class="small text-muted mb-0">
                This asset has no on-chain identity on its own. When you request a loan against it, the protocol creates a TRDC state PDA on Solana that holds the loan record (principal, due date, status). The PDA address and the related transactions are shown on the loan detail page.
            </p>
        </div>
    </div>
</div>
@endsection
