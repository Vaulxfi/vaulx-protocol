@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Loan ' . $loan->code)
@section('page-subtitle')
    <span class="badge bg-{{ $loan->status_color }}">{{ $loan->status_label }}</span>
    <span class="badge bg-light text-dark ms-1">{{ $loan->currency }}</span>
@endsection
@section('page-actions')
    @if($loan->status === 'pending_custody')
        <form method="POST" action="{{ route('admin.loan.approve', $loan) }}" class="d-inline">
            @csrf
            <button class="btn btn-success btn-sm" onclick="return confirm('Approve custody and activate loan?')">
                <i class="bi bi-check-lg me-1"></i>Approve Custody
            </button>
        </form>
    @endif
    @if(in_array($loan->status, ['active', 'overdue']))
        <form method="POST" action="{{ route('admin.loan.repaid', $loan) }}" class="d-inline">
            @csrf
            <button class="btn btn-info btn-sm" onclick="return confirm('Mark as repaid?')">
                <i class="bi bi-check-circle me-1"></i>Mark Repaid
            </button>
        </form>
        <form method="POST" action="{{ route('admin.loan.default', $loan) }}" class="d-inline">
            @csrf
            <button class="btn btn-dark btn-sm" onclick="return confirm('Mark as defaulted?')">
                <i class="bi bi-x-circle me-1"></i>Defaulted
            </button>
        </form>
    @endif
@endsection

@section('panel-content')
<div class="row g-4">
    <div class="col-lg-8">
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3">Loan Details</h6>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <small class="text-muted d-block">Principal</small>
                    <h5 class="fw-bold">{{ $loan->formatAmount($loan->principal) }}</h5>
                </div>
                <div class="col-md-4 mb-3">
                    <small class="text-muted d-block">Outstanding balance</small>
                    <h5 class="fw-bold text-danger">{{ $loan->formatAmount($loan->outstanding_balance) }}</h5>
                </div>
                <div class="col-md-4 mb-3">
                    <small class="text-muted d-block">Total paid</small>
                    <h5 class="fw-bold text-success">{{ $loan->formatAmount($loan->total_repaid) }}</h5>
                </div>
            </div>
            <div class="progress mb-3" style="height:10px">
                <div class="progress-bar bg-success" style="width:{{ $loan->progress_percent }}%"></div>
            </div>
            <div class="row">
                <div class="col-md-3 mb-2"><small class="text-muted d-block">LTV</small><strong>{{ $loan->ltv_percent }}%</strong></div>
                <div class="col-md-3 mb-2"><small class="text-muted d-block">Rate</small><strong>{{ $loan->interest_rate }}% APR</strong></div>
                <div class="col-md-3 mb-2"><small class="text-muted d-block">Term</small><strong>{{ $loan->term_months }}m</strong></div>
                <div class="col-md-3 mb-2"><small class="text-muted d-block">Currency</small><strong>{{ $loan->currency }}</strong></div>
                <div class="col-md-3 mb-2"><small class="text-muted d-block">Origination</small><strong>{{ $loan->formatAmount($loan->origination_fee) }}</strong></div>
                <div class="col-md-3 mb-2"><small class="text-muted d-block">Asset value</small><strong>{{ $loan->formatAmount($loan->asset_value) }}</strong></div>
                <div class="col-md-3 mb-2"><small class="text-muted d-block">Start</small><strong>{{ $loan->start_date ? $loan->start_date->format(config('app.date_format')) : '—' }}</strong></div>
                <div class="col-md-3 mb-2"><small class="text-muted d-block">Due</small><strong>{{ $loan->due_date ? $loan->due_date->format(config('app.date_format')) : '—' }}</strong></div>
            </div>
        </div>

        <div class="card p-4">
            <h6 class="fw-bold mb-3">Installments ({{ $loan->payments->count() }})</h6>
            @if($loan->payments->isEmpty())
                <p class="text-muted text-center py-3">Installments will be generated after approval.</p>
            @else
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead><tr><th>#</th><th>Due</th><th>Principal</th><th>Interest</th><th>Payment</th><th>Status</th><th>Paid on</th><th>TX Hash</th></tr></thead>
                        <tbody>
                        @foreach($loan->payments as $p)
                            <tr class="{{ $p->isOverdue() ? 'table-danger' : '' }}">
                                <td>{{ $p->installment_number }}</td>
                                <td>{{ $p->due_date->format(config('app.date_format')) }}</td>
                                <td>{{ $loan->formatAmount($p->principal_portion) }}</td>
                                <td>{{ $loan->formatAmount($p->interest_portion) }}</td>
                                <td>{{ $loan->formatAmount($p->amount_due) }}</td>
                                <td><span class="badge bg-{{ $p->status === 'paid' ? 'success' : ($p->status === 'overdue' ? 'danger' : 'warning') }}">{{ $p->status_label }}</span></td>
                                <td>{{ $p->paid_at ? $p->paid_at->format(config('app.date_format')) : '-' }}</td>
                                <td>
                                    @if($p->tx_hash)
                                        <a href="{{ $loan->explorerUrl('tx', $p->tx_hash) }}" target="_blank" rel="noopener" class="wallet-addr text-decoration-none" title="{{ $p->tx_hash }}">
                                            {{ Str::limit($p->tx_hash, 12) }}… <i class="bi bi-box-arrow-up-right" style="font-size:.7rem"></i>
                                        </a>
                                    @else
                                        -
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>
    </div>

    <div class="col-lg-4">
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-person me-1"></i>Borrower</h6>
            <strong>{{ $loan->user->name }}</strong>
            <small class="text-muted d-block">{{ $loan->user->email }}</small>
            @if($loan->user->cpf_cnpj)<small class="text-muted d-block">Tax ID: {{ $loan->user->cpf_cnpj }}</small>@endif
            @if($loan->user->phone)<small class="text-muted d-block">Phone: {{ $loan->user->phone }}</small>@endif
        </div>

        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-box-seam me-1"></i>Collateral</h6>
            <strong>{{ $loan->asset->brand }} {{ $loan->asset->model }}</strong>
            <small class="text-muted d-block">{{ $loan->asset->category_label }} | {{ ucfirst($loan->asset->condition) }}</small>
            <hr>
            <small class="text-muted d-block">Custody</small>
            <span class="badge bg-{{ $loan->asset->custody_status_color }}">{{ $loan->asset->custody_status_label }}</span>
            @if($loan->asset->custody_location)
                <small class="text-muted d-block mt-1">{{ $loan->asset->custody_location }}</small>
            @endif
        </div>

        <x-solana-panel :loan="$loan" />
    </div>
</div>
@endsection
