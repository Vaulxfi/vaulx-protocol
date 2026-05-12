@extends('layouts.panel')
@section('sidebar') @include('evaluator.sidebar') @endsection
@section('page-title', 'Offline evaluation queue')
@section('page-subtitle', 'Physical inspection. You do not see online report or market data.')

@section('panel-content')
<div class="row g-3 mb-4">
    <div class="col-md-4">
        <x-stat-card label="Current score" :value="$score?->current_score ?? '—'" :hint="'Tier ' . ($score?->tier ?? 1)" icon="award" variant="accent" />
    </div>
    <div class="col-md-4">
        <x-stat-card label="Pending" :value="$assigned->count()" hint="Watch in custody" icon="clipboard" />
    </div>
    <div class="col-md-4">
        <x-stat-card label="Completed" :value="$done->count()" hint="Consolidated" icon="check-circle" variant="accent" />
    </div>
</div>

<x-card title="Pending assignments" icon="list-check">
    @if($assigned->isEmpty())
        <x-empty-state icon="inbox" title="No pending offline evaluations" description="Assignments appear after owner decides to advance." />
    @else
        <div class="table-responsive">
            <table class="table align-middle">
                <thead><tr><th>Asset</th><th>Ref.</th><th>Checked in</th><th></th></tr></thead>
                <tbody>
                @foreach($assigned as $eval)
                    <tr>
                        <td><strong>{{ $eval->asset->brand }} {{ $eval->asset->model }}</strong></td>
                        <td><code>{{ $eval->asset->reference_number ?: '—' }}</code></td>
                        <td>{{ $eval->owner_decided_at?->format(config('app.datetime_format')) ?? '—' }}</td>
                        <td><a href="{{ route('evaluator.offline.show', $eval) }}" class="btn btn-gf btn-sm">Start report</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
</x-card>
@endsection
