@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Evaluate Asset')
@section('page-subtitle')
    {{ $asset->brand }} {{ $asset->model }} — submitted by {{ $asset->user->name }}
@endsection

@php
    // Resolve the price the admin should approve at:
    //   consolidated  → evaluation.final_value (avg of online + offline)
    //   offline-only  → offline_report.value_usd (most-authoritative single)
    //   online-only   → online_report.value_usd
    //   nothing yet   → estimated_value (legacy fallback)
    $onlineReport = $evaluation?->onlineReport;
    $offlineReport = $evaluation?->offlineReport;
    if ($evaluation?->status === 'consolidated' && $evaluation->final_value) {
        $defaultPrice = $evaluation->final_value;
        $priceSource = 'Triple Validation consolidated';
    } elseif ($offlineReport) {
        $defaultPrice = $offlineReport->value_usd;
        $priceSource = 'Offline evaluator (physical)';
    } elseif ($onlineReport) {
        $defaultPrice = $onlineReport->value_usd;
        $priceSource = 'Online evaluator (preliminary)';
    } else {
        $defaultPrice = $asset->estimated_value;
        $priceSource = 'Client request (no evaluator review yet)';
    }
@endphp

@section('panel-content')
<div class="row g-4">
    <div class="col-lg-7">
        @if ($evaluation && ($onlineReport || $offlineReport))
        {{-- Triple Validation reports — admin reads what the evaluators
             actually landed on before signing off on a final price. --}}
        <div class="card p-4 mb-4" style="border-left:4px solid var(--gf-accent)">
            <h6 class="fw-bold mb-3">
                <i class="bi bi-clipboard-data me-1" style="color:var(--gf-accent)"></i>
                Triple Validation reports
                <span class="badge bg-secondary ms-2 text-uppercase" style="font-size:.65rem">
                    status: {{ $evaluation->status }}
                </span>
            </h6>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="p-3 rounded" style="background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.20)">
                        <small class="text-muted d-block mb-1">Online evaluator (remote)</small>
                        @if ($onlineReport)
                            <div class="fw-bold" style="font-size:1.5rem;color:var(--vx-gold)">
                                ${{ number_format($onlineReport->value_usd, 2) }}
                            </div>
                            <ul class="small list-unstyled mb-0 mt-2">
                                <li><strong>Grade:</strong> {{ strtoupper($onlineReport->grade) }}</li>
                                <li><strong>Box:</strong> {{ $onlineReport->has_box ? 'yes' : 'no' }} · <strong>Papers:</strong> {{ $onlineReport->has_papers ? 'yes' : 'no' }}</li>
                                @if ($onlineReport->replica_signs)
                                    <li class="text-warning"><strong>⚠ Replica signs flagged</strong></li>
                                @endif
                                <li><strong>Submitted:</strong> {{ $onlineReport->submitted_at?->diffForHumans() ?? '—' }}</li>
                            </ul>
                        @else
                            <p class="small text-muted mb-0">Awaiting submission.</p>
                        @endif
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded" style="background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.20)">
                        <small class="text-muted d-block mb-1">Offline evaluator (physical)</small>
                        @if ($offlineReport)
                            <div class="fw-bold" style="font-size:1.5rem;color:var(--vx-gold)">
                                ${{ number_format($offlineReport->value_usd, 2) }}
                            </div>
                            <ul class="small list-unstyled mb-0 mt-2">
                                <li><strong>Grade:</strong> {{ strtoupper($offlineReport->grade) }}</li>
                                <li><strong>Caliber:</strong> {{ $offlineReport->caliber ?: '—' }}</li>
                                <li><strong>Verdict:</strong>
                                    <span class="badge bg-{{ $offlineReport->authenticity === 'authentic' ? 'success' : ($offlineReport->authenticity === 'suspect' ? 'warning text-dark' : 'danger') }}">
                                        {{ ucfirst($offlineReport->authenticity) }}
                                    </span>
                                </li>
                                <li><strong>Serial match:</strong> {{ $offlineReport->serial_match ? 'yes' : 'no' }}</li>
                                @if ($offlineReport->timing_rate !== null)
                                    <li><strong>Timing:</strong> {{ $offlineReport->timing_rate > 0 ? '+' : '' }}{{ $offlineReport->timing_rate }} s/day</li>
                                @endif
                                <li><strong>Submitted:</strong> {{ $offlineReport->submitted_at?->diffForHumans() ?? '—' }}</li>
                            </ul>
                        @else
                            <p class="small text-muted mb-0">Awaiting offline inspection.</p>
                        @endif
                    </div>
                </div>
            </div>
            @if ($evaluation->final_value)
                <hr>
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <small class="text-muted d-block">Consolidated final value</small>
                        <strong style="font-size:1.6rem;color:var(--vx-gold);font-family:'Playfair Display',serif">
                            ${{ number_format($evaluation->final_value, 2) }}
                        </strong>
                    </div>
                    <small class="text-muted">average of online + offline</small>
                </div>
            @endif
            @if (!empty($evaluation->alerts))
                <hr>
                <div class="alert alert-warning small mb-0">
                    <strong><i class="bi bi-exclamation-triangle me-1"></i>Alerts:</strong>
                    @foreach ($evaluation->alerts as $alert)
                        <div>· {{ $alert['type'] ?? 'unknown' }}{{ isset($alert['message']) ? ' — ' . $alert['message'] : '' }}</div>
                    @endforeach
                </div>
            @endif
        </div>
        @endif

        {{-- Asset details --}}
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-box-seam me-1" style="color:var(--gf-primary)"></i>Asset Data</h6>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Category</small>
                    <strong>{{ $asset->category_label }}</strong>
                </div>
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Condition declared</small>
                    <strong>{{ ucfirst($asset->condition) }}</strong>
                </div>
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Brand / Model</small>
                    <strong>{{ $asset->brand }} {{ $asset->model }}</strong>
                </div>
                <div class="col-md-6 mb-3">
                    <small class="text-muted d-block">Serial number</small>
                    <strong>{{ $asset->serial_number ?: '—' }}</strong>
                </div>
            </div>
            <div class="mb-3">
                <small class="text-muted d-block">Client description</small>
                <p class="mb-0">{{ $asset->description }}</p>
            </div>

            @if($asset->photo_urls && count($asset->photo_urls))
            <hr>
            <h6 class="fw-bold mb-2"><i class="bi bi-camera me-1"></i>Client photos</h6>
            <div class="row g-2 mb-3">
                @foreach($asset->photo_urls as $url)
                    <div class="col-md-3 col-4">
                        <a href="{{ $url }}" target="_blank">
                            <img src="{{ $url }}" class="img-fluid rounded" style="width:100%;height:100px;object-fit:cover" alt="Photo">
                        </a>
                    </div>
                @endforeach
            </div>
            @endif

            <hr>
            <div class="d-flex align-items-center">
                <div class="me-4">
                    <small class="text-muted d-block">Value requested by client</small>
                    <h4 class="fw-bold mb-0">${{ number_format($asset->estimated_value, 2) }}</h4>
                </div>
            </div>
        </div>

        {{-- Client info --}}
        <div class="card p-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-person me-1"></i>Client</h6>
            <strong>{{ $asset->user->name }}</strong>
            <small class="text-muted d-block">{{ $asset->user->email }}</small>
            @if($asset->user->cpf_cnpj)<small class="text-muted d-block">Tax ID: {{ $asset->user->cpf_cnpj }}</small>@endif
            @if($asset->user->phone)<small class="text-muted d-block">Phone: {{ $asset->user->phone }}</small>@endif
        </div>
    </div>

    <div class="col-lg-5">
        <div class="card p-4" style="border-left:4px solid var(--gf-accent)">
            <h6 class="fw-bold mb-3"><i class="bi bi-clipboard-check me-1" style="color:var(--gf-accent)"></i>Evaluation Form</h6>
            <form method="POST" action="{{ route('admin.asset.approve', $asset) }}">
                @csrf
                <div class="mb-3">
                    <label class="form-label fw-semibold">Appraised value (USD) *</label>
                    <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" name="appraised_value" class="form-control @error('appraised_value') is-invalid @enderror"
                               value="{{ old('appraised_value', $defaultPrice) }}" min="100" step="100" required>
                        @error('appraised_value')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                    <small class="text-muted d-block">
                        Pre-filled from <strong>{{ $priceSource }}</strong>.
                    </small>
                    <small class="text-muted d-block">
                        Client requested: ${{ number_format($asset->estimated_value, 2) }}
                        @if ($onlineReport)
                            · Online: ${{ number_format($onlineReport->value_usd, 2) }}
                        @endif
                        @if ($offlineReport)
                            · Offline: ${{ number_format($offlineReport->value_usd, 2) }}
                        @endif
                    </small>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Confirmed condition *</label>
                    <select name="condition" class="form-select" required>
                        <option value="excellent" {{ $asset->condition == 'excellent' ? 'selected' : '' }}>Excellent</option>
                        <option value="good" {{ $asset->condition == 'good' ? 'selected' : '' }}>Good</option>
                        <option value="fair" {{ $asset->condition == 'fair' ? 'selected' : '' }}>Fair</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Custody location *</label>
                    <input type="text" name="custody_location" class="form-control @error('custody_location') is-invalid @enderror"
                           value="{{ old('custody_location', 'Vaulx Vault #001 — Sao Paulo, SP') }}" required>
                    @error('custody_location')<div class="invalid-feedback">{{ $message }}</div>@enderror
                </div>

                <div class="alert alert-info small">
                    <i class="bi bi-info-circle me-1"></i>
                    Upon approval, the status will change to <strong>"Evaluated"</strong> and the client will be able to request a loan based on the appraised value.
                </div>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-success px-4"><i class="bi bi-check-lg me-1"></i>Approve Evaluation</button>
                    <a href="{{ route('admin.assets.pending') }}" class="btn btn-outline-secondary">Back</a>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
