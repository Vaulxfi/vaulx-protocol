@extends('layouts.panel')
@section('sidebar') @include('borrower.sidebar') @endsection
@section('page-title', 'My Loans')
@section('page-subtitle', 'All loans associated with your account')

@section('panel-content')
<div class="card p-4">
    @if($loans->isEmpty())
        <x-empty-state
            icon="cash-coin"
            title="No loans yet"
            description="Register an asset and request your first credit. Approvals take less than 24h."
            action-label="Register Asset"
            :action-url="route('borrower.asset.create')" />
    @else
        <div class="table-responsive">
            <table class="table align-middle">
                <thead><tr><th>Code</th><th>Asset</th><th>Principal</th><th>Balance</th><th>Currency</th><th>Status</th><th>Term</th><th>Progress</th><th></th></tr></thead>
                <tbody>
                @foreach($loans as $loan)
                    <tr>
                        <td><strong>{{ $loan->code }}</strong></td>
                        <td>{{ $loan->asset->brand }} {{ $loan->asset->model }}</td>
                        <td>{{ $loan->formatAmount($loan->principal) }}</td>
                        <td>{{ $loan->formatAmount($loan->outstanding_balance) }}</td>
                        <td><span class="badge bg-light text-dark">{{ $loan->currency }}</span></td>
                        <td><span class="badge bg-{{ $loan->status_color }}">{{ $loan->status_label }}</span></td>
                        <td>{{ $loan->term_months }}m</td>
                        <td>
                            <div class="progress" style="height:6px;width:80px">
                                <div class="progress-bar bg-success" style="width:{{ $loan->progress_percent }}%"></div>
                            </div>
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
