@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Evaluators')
@section('page-subtitle', 'Scores, tiers and assignment.')

@section('panel-content')
<div class="row g-4 mb-2">
    <div class="col-md-6">
        <x-card title="Tier distribution — online" icon="pie-chart">
            <div style="position:relative;height:180px"><canvas id="tier-online"></canvas></div>
        </x-card>
    </div>
    <div class="col-md-6">
        <x-card title="Tier distribution — offline" icon="pie-chart">
            <div style="position:relative;height:180px"><canvas id="tier-offline"></canvas></div>
        </x-card>
    </div>
</div>

<div class="row g-4">
    <div class="col-lg-6">
        <x-card title="Online evaluators" icon="eye">
            @if($online->isEmpty())
                <x-empty-state icon="people" title="No online evaluators yet" description="Promote a user via tinker: User::find(ID)->update(['role' => 'evaluator_online'])." />
            @else
                <table class="table table-sm align-middle">
                    <thead><tr><th>Name</th><th>Score</th><th>Tier</th><th>Reports</th></tr></thead>
                    <tbody>
                    @foreach($online as $u)
                        @php $s = $u->evaluatorScores->where('layer','online')->first(); @endphp
                        <tr>
                            <td>{{ $u->name }}</td>
                            <td><strong>{{ $s?->current_score ?? '—' }}</strong></td>
                            <td><span class="badge bg-{{ $s ? $s->tierColor() : 'secondary' }}">Tier {{ $s?->tier ?? 1 }}</span></td>
                            <td>{{ $s?->total_reports ?? 0 }}</td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            @endif
        </x-card>
    </div>

    <div class="col-lg-6">
        <x-card title="Offline evaluators" icon="tools">
            @if($offline->isEmpty())
                <x-empty-state icon="people" title="No offline evaluators yet" description="Promote a user via tinker." />
            @else
                <table class="table table-sm align-middle">
                    <thead><tr><th>Name</th><th>Score</th><th>Tier</th><th>Reports</th></tr></thead>
                    <tbody>
                    @foreach($offline as $u)
                        @php $s = $u->evaluatorScores->where('layer','offline')->first(); @endphp
                        <tr>
                            <td>{{ $u->name }}</td>
                            <td><strong>{{ $s?->current_score ?? '—' }}</strong></td>
                            <td><span class="badge bg-{{ $s ? $s->tierColor() : 'secondary' }}">Tier {{ $s?->tier ?? 1 }}</span></td>
                            <td>{{ $s?->total_reports ?? 0 }}</td>
                        </tr>
                    @endforeach
                </tbody>
                </table>
            @endif
        </x-card>
    </div>
</div>

<x-card title="Pending evaluations" icon="clipboard-check" class="mt-4">
    @if($pending->isEmpty())
        <x-empty-state icon="check-circle" title="Everything assigned" description="No pending evaluations needing assignment." />
    @else
        <div class="table-responsive">
            <table class="table align-middle">
                <thead><tr><th>Asset</th><th>Owner</th><th>Status</th><th>Assign</th></tr></thead>
                <tbody>
                @foreach($pending as $eval)
                    <tr>
                        <td><strong>{{ $eval->asset->brand }} {{ $eval->asset->model }}</strong> <code class="text-muted">{{ $eval->asset->reference_number }}</code></td>
                        <td>{{ $eval->asset->user->name }}</td>
                        <td><span class="badge bg-warning">{{ $eval->statusLabel() }}</span></td>
                        <td>
                            <form method="POST" action="{{ route('admin.evaluators.assign') }}" class="d-flex gap-1">
                                @csrf
                                <input type="hidden" name="evaluation_id" value="{{ $eval->id }}">
                                <input type="hidden" name="layer" value="{{ $eval->status === \App\Models\Evaluation::STATUS_PENDING_OFFLINE ? 'offline' : 'online' }}">
                                <select name="user_id" class="form-select form-select-sm" style="max-width:220px">
                                    <option value="">Select user...</option>
                                    @foreach(($eval->status === \App\Models\Evaluation::STATUS_PENDING_OFFLINE ? $offline : $online) as $u)
                                        <option value="{{ $u->id }}">{{ $u->name }}</option>
                                    @endforeach
                                </select>
                                <button type="submit" class="btn btn-gf btn-sm">Assign</button>
                            </form>
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
</x-card>
@endsection

@push('scripts')
    @vite('resources/js/pages/admin-evaluators.js')
@endpush
