@extends('layouts.panel')
@section('sidebar') @include('evaluator.sidebar') @endsection
@section('page-title', 'Online evaluation queue')
@section('page-subtitle', 'Blind review based on photos and video. No market data visible.')

@section('panel-content')
<div class="row g-3 mb-4">
    <div class="col-md-4">
        <x-stat-card label="Current score" :value="$score?->current_score ?? '—'" :hint="'Tier ' . ($score?->tier ?? 1)" icon="award" variant="accent" />
    </div>
    <div class="col-md-4">
        <x-stat-card label="Pending" :value="$assigned->count()" hint="Awaiting your report" icon="clipboard" />
    </div>
    <div class="col-md-4">
        <x-stat-card label="Completed" :value="$done->count()" hint="Last 10 visible" icon="check-circle" variant="accent" />
    </div>
</div>

<x-card title="Pending assignments" icon="list-check">
    @if($assigned->isEmpty())
        <x-empty-state icon="inbox" title="No pending evaluations" description="New assignments appear here." />
    @else
        <div class="table-responsive">
            <table class="table align-middle">
                <thead><tr><th>Asset</th><th>Ref.</th><th>Category</th><th>Submitted</th><th></th></tr></thead>
                <tbody>
                @foreach($assigned as $eval)
                    <tr>
                        <td><strong>{{ $eval->asset->brand }} {{ $eval->asset->model }}</strong></td>
                        <td><code>{{ $eval->asset->reference_number ?: '—' }}</code></td>
                        <td>{{ $eval->asset->category_label }}</td>
                        <td>{{ $eval->created_at->format(config('app.datetime_format')) }}</td>
                        <td><a href="{{ route('evaluator.online.show', $eval) }}" class="btn btn-gf btn-sm">Start report</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
</x-card>

<x-card title="Recent submissions" icon="clock-history" class="mt-4">
    @if($done->isEmpty())
        <p class="text-muted mb-0">Nothing yet.</p>
    @else
        <div class="table-responsive">
            <table class="table table-sm align-middle">
                <thead><tr><th>Asset</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>
                @foreach($done as $eval)
                    <tr>
                        <td>{{ $eval->asset->brand }} {{ $eval->asset->model }}</td>
                        <td>{{ $eval->onlineReport?->submitted_at?->format(config('app.datetime_format')) ?? '—' }}</td>
                        <td><span class="badge bg-info">{{ $eval->statusLabel() }}</span></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
</x-card>
@endsection
