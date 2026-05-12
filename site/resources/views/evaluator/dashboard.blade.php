@extends('layouts.panel')
@section('sidebar') @include('evaluator.sidebar') @endsection
@section('page-title', 'Evaluator queue')
@section('page-subtitle')
    @if($canOnline && $canOffline) Both layers available (admin view)
    @elseif($canOnline) Online layer — blind review by photos & video
    @elseif($canOffline) Offline layer — physical inspection
    @endif
@endsection

@section('panel-content')
<div class="row g-3 mb-4">
    @if($canOnline)
    <div class="col-md-3">
        <x-stat-card label="Online score" :value="$onlineScore?->current_score ?? '—'" :hint="'Tier ' . ($onlineScore?->tier ?? 1)" icon="eye" variant="accent" />
    </div>
    <div class="col-md-3">
        <x-stat-card label="Pending online" :value="$pendingOnline->count()" hint="Awaiting your report" icon="clipboard" />
    </div>
    @endif
    @if($canOffline)
    <div class="col-md-3">
        <x-stat-card label="Offline score" :value="$offlineScore?->current_score ?? '—'" :hint="'Tier ' . ($offlineScore?->tier ?? 1)" icon="tools" variant="accent" />
    </div>
    <div class="col-md-3">
        <x-stat-card label="Pending offline" :value="$pendingOffline->count()" hint="Watch in custody" icon="clipboard" />
    </div>
    @endif
</div>

<div class="row g-4">
    @if($canOnline)
    <div class="col-lg-6">
        <x-card title="Online queue" icon="eye">
            @if($pendingOnline->isEmpty())
                <x-empty-state icon="inbox" title="No pending online evaluations" description="New online assignments will appear here." />
            @else
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead><tr><th>Asset</th><th>Ref.</th><th></th></tr></thead>
                        <tbody>
                        @foreach($pendingOnline as $eval)
                            <tr>
                                <td>
                                    <strong>{{ $eval->asset->brand }} {{ $eval->asset->model }}</strong>
                                    @if(is_null($eval->online_evaluator_id ?? $eval->offline_evaluator_id))
                                        <span class="badge bg-warning ms-1">POOL</span>
                                    @endif
                                    <small class="text-muted d-block">{{ $eval->asset->user->name }} · {{ $eval->created_at->format(config('app.date_format')) }}</small>
                                </td>
                                <td><code>{{ $eval->asset->reference_number ?: '—' }}</code></td>
                                <td>
                                    @if(auth()->user()->isEvaluatorOnline() || auth()->user()->isAdmin())
                                        <a href="{{ route('evaluator.online.show', $eval) }}" class="btn btn-gf btn-sm">Start</a>
                                    @else
                                        <span class="text-muted small">Online only</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </x-card>
    </div>
    @endif

    @if($canOffline)
    <div class="col-lg-6">
        <x-card title="Offline queue" icon="tools">
            @if($pendingOffline->isEmpty())
                <x-empty-state icon="inbox" title="No pending offline evaluations" description="Assignments appear after owner decides to advance." />
            @else
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead><tr><th>Asset</th><th>Ref.</th><th></th></tr></thead>
                        <tbody>
                        @foreach($pendingOffline as $eval)
                            <tr>
                                <td>
                                    <strong>{{ $eval->asset->brand }} {{ $eval->asset->model }}</strong>
                                    <small class="text-muted d-block">{{ $eval->asset->user->name }} · Owner decided {{ $eval->owner_decided_at?->format(config('app.date_format')) }}</small>
                                </td>
                                <td><code>{{ $eval->asset->reference_number ?: '—' }}</code></td>
                                <td>
                                    @if(auth()->user()->isEvaluatorOffline() || auth()->user()->isAdmin())
                                        <a href="{{ route('evaluator.offline.show', $eval) }}" class="btn btn-gf btn-sm">Start</a>
                                    @else
                                        <span class="text-muted small">Offline only</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </x-card>
    </div>
    @endif
</div>

<x-card title="Recent activity" icon="clock-history" class="mt-4">
    @if($recent->isEmpty())
        <p class="text-muted mb-0">Nothing yet.</p>
    @else
        <div class="table-responsive">
            <table class="table table-sm align-middle">
                <thead><tr><th>Asset</th><th>Your layer</th><th>Status</th><th>Final value</th></tr></thead>
                <tbody>
                @foreach($recent as $eval)
                    @php
                        $layer = $eval->online_evaluator_id === auth()->id() ? 'online'
                            : ($eval->offline_evaluator_id === auth()->id() ? 'offline' : '—');
                        $score = $eval->{$layer . 'Report'}?->scores['final'] ?? null;
                    @endphp
                    <tr>
                        <td>{{ $eval->asset->brand }} {{ $eval->asset->model }}</td>
                        <td><span class="badge bg-light text-dark">{{ ucfirst($layer) }}</span></td>
                        <td><span class="badge bg-info">{{ $eval->statusLabel() }}</span></td>
                        <td>
                            @if($eval->final_value)
                                <x-money :amount="$eval->final_value" />
                                @if($score)<span class="ms-2"><x-score-pill :score="$score" /></span>@endif
                            @else
                                —
                            @endif
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
</x-card>
@endsection
