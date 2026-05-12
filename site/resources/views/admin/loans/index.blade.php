@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Loans')
@section('page-subtitle', request('status') ? \App\Models\Loan::STATUSES[request('status')] ?? 'All' : 'All loans')

@section('panel-content')
<div class="card p-4">
    {{-- Status filters --}}
    <div class="mb-3 d-flex gap-2 flex-wrap">
        <a href="{{ route('admin.loans') }}" class="btn btn-sm {{ !request('status') ? 'btn-gf' : 'btn-outline-secondary' }}">All</a>
        @foreach(\App\Models\Loan::STATUSES as $key => $label)
            <a href="{{ route('admin.loans', ['status' => $key]) }}"
               class="btn btn-sm {{ request('status') === $key ? 'btn-gf' : 'btn-outline-secondary' }}">
                {{ $label }}
            </a>
        @endforeach
    </div>

    <div class="table-responsive">
        <table class="table align-middle">
            <thead><tr><th>Code</th><th>Borrower</th><th>Asset</th><th>Principal</th><th>Balance</th><th>Currency</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
            @forelse($loans as $loan)
                <tr>
                    <td><strong>{{ $loan->code }}</strong></td>
                    <td>{{ $loan->user->name }}</td>
                    <td>{{ $loan->asset->brand }} {{ $loan->asset->model }}</td>
                    <td>{{ $loan->formatAmount($loan->principal) }}</td>
                    <td>{{ $loan->formatAmount($loan->outstanding_balance) }}</td>
                    <td><span class="badge bg-light text-dark">{{ $loan->currency }}</span></td>
                    <td><span class="badge bg-{{ $loan->status_color }}">{{ $loan->status_label }}</span></td>
                    <td>{{ $loan->created_at->format(config('app.date_format')) }}</td>
                    <td><a href="{{ route('admin.loan.show', $loan) }}" class="btn btn-sm btn-outline-secondary">Details</a></td>
                </tr>
            @empty
                <tr><td colspan="9" class="text-center text-muted py-4">No loans found.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    {{ $loans->withQueryString()->links() }}
</div>
@endsection
