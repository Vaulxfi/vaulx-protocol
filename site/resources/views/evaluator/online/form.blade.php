@extends('layouts.panel')
@section('sidebar') @include('evaluator.sidebar') @endsection
@section('page-title', 'Online report — ' . $evaluation->asset->brand . ' ' . $evaluation->asset->model)
@section('page-subtitle')
    Blind review: <strong>you don't see market data</strong> nor the offline report during this step.
@endsection

@section('panel-content')
<div class="row g-4">
    <div class="col-lg-7">
        <x-card title="Asset details" icon="watch">
            <div class="row">
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Brand</small><strong>{{ $evaluation->asset->brand }}</strong></div>
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Model</small><strong>{{ $evaluation->asset->model ?: '—' }}</strong></div>
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Reference #</small><code>{{ $evaluation->asset->reference_number ?: '—' }}</code></div>
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Serial #</small><code>{{ $evaluation->asset->serial_number ?: '—' }}</code></div>
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Owner’s estimate</small><x-money :amount="$evaluation->asset->estimated_value" /></div>
                <div class="col-md-6 mb-2"><small class="text-muted d-block">Declared condition</small><strong>{{ ucfirst($evaluation->asset->condition) }}</strong></div>
            </div>
            <hr>
            <small class="text-muted d-block mb-2">Owner description</small>
            <p class="mb-0">{{ $evaluation->asset->description }}</p>

            @if($evaluation->asset->photo_urls && count($evaluation->asset->photo_urls))
                <hr>
                <small class="text-muted d-block mb-2">Photos</small>
                <div class="row g-2">
                    @foreach($evaluation->asset->photo_urls as $url)
                        <div class="col-md-4 col-6">
                            <a href="{{ $url }}" target="_blank"><img src="{{ $url }}" class="img-fluid rounded" style="width:100%;height:140px;object-fit:cover"></a>
                        </div>
                    @endforeach
                </div>
            @endif

            @if($evaluation->asset->video_url)
                <hr>
                <small class="text-muted d-block mb-2">Video</small>
                <video src="{{ $evaluation->asset->video_url }}" controls class="w-100 rounded" style="max-height:280px"></video>
            @endif
        </x-card>
    </div>

    <div class="col-lg-5">
        <x-card title="Your report" icon="pen">
            <form method="POST" action="{{ route('evaluator.online.submit', $evaluation) }}">
                @csrf
                <div class="alert alert-warning small mb-3">
                    <i class="bi bi-eye-slash me-1"></i>
                    Market data and the offline evaluator's value are hidden until you submit.
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold" for="value_usd">Appraised value (USD) <span class="text-danger">*</span></label>
                    <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" name="value_usd" id="value_usd" class="form-control" min="100" step="50" required>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold" for="grade">Overall grade <span class="text-danger">*</span></label>
                    <select name="grade" id="grade" class="form-select" required>
                        <option value="mint">MINT (100%)</option>
                        <option value="ex" selected>EX (88%)</option>
                        <option value="vg">VG (72%)</option>
                        <option value="g">G (55%)</option>
                        <option value="f">F (35%)</option>
                    </select>
                </div>

                <div class="row g-2 mb-3">
                    @foreach(['dial','case','bracelet','glass','crown'] as $part)
                    <div class="col-6">
                        <label class="form-label fw-semibold small" for="{{ $part }}_grade">{{ ucfirst($part) }}</label>
                        <select name="{{ $part }}_grade" id="{{ $part }}_grade" class="form-select form-select-sm" required>
                            <option value="mint">MINT</option><option value="ex" selected>EX</option>
                            <option value="vg">VG</option><option value="g">G</option><option value="f">F</option>
                        </select>
                    </div>
                    @endforeach
                </div>

                <div class="form-check mb-2">
                    <input type="checkbox" name="has_box" value="1" id="has_box" class="form-check-input">
                    <label class="form-check-label" for="has_box">Original box present</label>
                </div>
                <div class="form-check mb-2">
                    <input type="checkbox" name="has_papers" value="1" id="has_papers" class="form-check-input">
                    <label class="form-check-label" for="has_papers">Original papers present</label>
                </div>
                <div class="form-check mb-3">
                    <input type="checkbox" name="replica_signs" value="1" id="replica_signs" class="form-check-input">
                    <label class="form-check-label" for="replica_signs">Replica signs identified</label>
                </div>

                <button type="submit" class="btn btn-gf-accent w-100">Submit online report</button>
            </form>
        </x-card>
    </div>
</div>
@endsection

@push('scripts')
    @vite('resources/js/pages/evaluator-online-form.js')
@endpush
