@extends('layouts.panel')
@section('sidebar') @include('evaluator.sidebar') @endsection
@section('page-title', 'Offline report — ' . $evaluation->asset->brand . ' ' . $evaluation->asset->model)
@section('page-subtitle')
    Physical inspection. <strong>You do not see the online report or market data.</strong>
@endsection

@section('panel-content')
<div class="row g-4">
    <div class="col-lg-7">
        <x-card title="Asset details" icon="watch">
            <div class="row">
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Brand</small><strong>{{ $evaluation->asset->brand }}</strong></div>
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Model</small><strong>{{ $evaluation->asset->model ?: '—' }}</strong></div>
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Reference #</small><code>{{ $evaluation->asset->reference_number ?: '—' }}</code></div>
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Declared serial</small><code>{{ $evaluation->asset->serial_number ?: '—' }}</code></div>
            </div>
            <hr>
            <small class="text-muted d-block mb-2">Owner description</small>
            <p class="mb-0">{{ $evaluation->asset->description }}</p>
        </x-card>
    </div>

    <div class="col-lg-5">
        <x-card title="Your physical report" icon="tools">
            <form method="POST" action="{{ route('evaluator.offline.submit', $evaluation) }}">
                @csrf
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="value_usd">Final value (USD) <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" name="value_usd" id="value_usd" class="form-control" min="100" step="50" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="grade">Overall grade <span class="text-danger">*</span></label>
                    <select name="grade" id="grade" class="form-select" required>
                        <option value="mint">MINT</option><option value="ex" selected>EX</option>
                        <option value="vg">VG</option><option value="g">G</option><option value="f">F</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="caliber">Caliber <span class="text-danger">*</span></label>
                    <input type="text" name="caliber" id="caliber" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="serial_match">Movement serial matches case? <span class="text-danger">*</span></label>
                    <select name="serial_match" id="serial_match" class="form-select" required>
                        <option value="1">Yes</option><option value="0">No</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="timing_rate">Timing rate (s/day)</label>
                    <input type="number" step="0.1" name="timing_rate" id="timing_rate" class="form-control" placeholder="e.g. +2.5">
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="movement_notes">Movement notes</label>
                    <textarea name="movement_notes" id="movement_notes" class="form-control" rows="2"></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="authenticity">Final verdict <span class="text-danger">*</span></label>
                    <select name="authenticity" id="authenticity" class="form-select" required>
                        <option value="authentic">✅ Authentic</option>
                        <option value="suspect">⚠ Suspect</option>
                        <option value="replica">🚫 Replica</option>
                    </select>
                </div>
                <div class="form-check mb-2">
                    <input type="checkbox" name="has_box" value="1" id="has_box" class="form-check-input">
                    <label class="form-check-label" for="has_box">Original box present</label>
                </div>
                <div class="form-check mb-3">
                    <input type="checkbox" name="has_papers" value="1" id="has_papers" class="form-check-input">
                    <label class="form-check-label" for="has_papers">Original papers present</label>
                </div>

                <button type="submit" class="btn btn-gf-accent w-100">Submit offline report + consolidate</button>
            </form>
        </x-card>
    </div>
</div>
@endsection

@push('scripts')
    @vite('resources/js/pages/evaluator-offline-form.js')
@endpush
