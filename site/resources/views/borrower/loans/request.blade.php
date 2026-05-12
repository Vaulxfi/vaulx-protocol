@extends('layouts.panel')
@section('sidebar') @include('borrower.sidebar') @endsection
@section('page-title', 'Request Loan')
@section('page-subtitle', '4-step wizard')

@push('styles')
<style>
    .wizard-steps { display:flex; gap:0; margin-bottom:2rem; }
    .wizard-step {
        flex:1; text-align:center; padding:.75rem .5rem;
        background:#e9ecef; color:#6c757d; font-weight:600; font-size:.85rem;
        position:relative; cursor:default;
    }
    .wizard-step.active { background:var(--gf-primary); color:#fff; }
    .wizard-step.done { background:var(--gf-accent); color:var(--gf-dark); }
    .wizard-step:first-child { border-radius:8px 0 0 8px; }
    .wizard-step:last-child { border-radius:0 8px 8px 0; }
    .wizard-step .step-num {
        display:inline-flex; width:24px; height:24px; border-radius:50%;
        background:rgba(255,255,255,.3); align-items:center; justify-content:center;
        font-size:.75rem; margin-right:.35rem;
    }
    .wizard-panel { display:none; }
    .wizard-panel.active { display:block; }
    .asset-option { cursor:pointer; transition:all .15s; }
    .asset-option:hover, .asset-option.selected { border-color:var(--gf-primary)!important; box-shadow:0 0 0 2px rgba(108,60,224,.3); }
    .currency-card { cursor:pointer; transition:all .15s; border:2px solid #e9ecef; border-radius:12px; padding:1.5rem; text-align:center; }
    .currency-card:hover, .currency-card.selected { border-color:var(--gf-primary); box-shadow:0 0 0 2px rgba(108,60,224,.3); }
    .rate-pill { display:inline-block; padding:.15rem .5rem; background:rgba(108,60,224,.1); color:var(--gf-primary); border-radius:12px; font-size:.75rem; font-weight:600; }
</style>
@endpush

@section('panel-content')
<div class="card p-4">
    {{-- Step indicators --}}
    <div class="wizard-steps rounded overflow-hidden">
        <div class="wizard-step active" id="step-ind-1"><span class="step-num">1</span>Collateral</div>
        <div class="wizard-step" id="step-ind-2"><span class="step-num">2</span>Currency</div>
        <div class="wizard-step" id="step-ind-3"><span class="step-num">3</span>Amount</div>
        <div class="wizard-step" id="step-ind-4"><span class="step-num">4</span>Confirm</div>
    </div>

    <form method="POST" action="{{ route('borrower.loan.store') }}" id="loanForm">
        @csrf
        <input type="hidden" name="asset_id" id="f-asset-id">
        <input type="hidden" name="currency" id="f-currency">
        <input type="hidden" name="principal" id="f-principal">
        <input type="hidden" name="term_months" id="f-term">

        {{-- STEP 1 --}}
        <div class="wizard-panel active" id="step-1">
            <h5 class="fw-bold mb-3"><i class="bi bi-box-seam me-2" style="color:var(--gf-primary)"></i>Select Collateral</h5>
            @if($assets->isEmpty())
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    You don't have any evaluated assets available. <a href="{{ route('borrower.asset.create') }}">Register an asset</a> and wait for evaluation.
                </div>
            @else
                <div class="d-flex flex-column gap-3">
                    @foreach($assets as $asset)
                        <div class="asset-option p-3 rounded d-flex align-items-center justify-content-between"
                             style="border:2px solid #e9ecef"
                             data-asset-id="{{ $asset->id }}"
                             data-asset-name="{{ $asset->brand }} {{ $asset->model }}"
                             data-asset-value="{{ $asset->appraised_value }}"
                             data-asset-category="{{ $asset->category_label }}"
                             data-asset-nft="{{ Str::limit($asset->nft_mint_address, 10) }}">
                            <div class="d-flex align-items-center">
                                <div style="width:44px;height:44px;border-radius:10px;background:var(--gf-primary);display:flex;align-items:center;justify-content:center" class="me-3">
                                    <i class="bi bi-{{ $asset->category === 'watch' ? 'watch' : ($asset->category === 'jewelry' ? 'gem' : ($asset->category === 'art' ? 'palette' : 'car-front')) }} text-white"></i>
                                </div>
                                <div>
                                    <strong>{{ $asset->brand }} {{ $asset->model }}</strong>
                                    <small class="text-muted d-block">{{ $asset->category_label }} | Asset #{{ str_pad($asset->id, 4, '0', STR_PAD_LEFT) }}</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <strong style="color:var(--gf-accent);font-size:1.1rem">${{ number_format($asset->appraised_value, 2) }}</strong>
                                <small class="text-muted d-block">Appraised value</small>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
            <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-gf px-4" id="btn-next-1" disabled>Continue <i class="bi bi-arrow-right ms-1"></i></button>
            </div>
        </div>

        {{-- STEP 2 --}}
        <div class="wizard-panel" id="step-2">
            <h5 class="fw-bold mb-3"><i class="bi bi-coin me-2" style="color:var(--gf-primary)"></i>Disbursement Currency</h5>
            <p class="text-muted small mb-3">
                Choose the currency you want to receive. Repayment must be made in the same currency.
                <span class="rate-pill ms-1">USD/BRL: R$ <span id="rate-display">—</span></span>
            </p>
            <div class="row g-4 justify-content-center mb-3">
                <div class="col-md-5">
                    <div class="currency-card" data-currency="USDC">
                        <div style="width:50px;height:50px;border-radius:50%;background:#2775ca;display:flex;align-items:center;justify-content:center;margin:0 auto .75rem">
                            <span class="fw-bold text-white" style="font-size:1.3rem">U</span>
                        </div>
                        <h5 class="fw-bold mb-1">USDC</h5>
                        <small class="text-muted">USD Coin — dollar stablecoin</small>
                        <hr>
                        <small class="d-block text-muted">+ Protects against BRL inflation</small>
                        <small class="d-block text-muted">- Exposure to FX variation</small>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="currency-card" data-currency="BRZ">
                        <div style="width:50px;height:50px;border-radius:50%;background:#00a86b;display:flex;align-items:center;justify-content:center;margin:0 auto .75rem">
                            <span class="fw-bold text-white" style="font-size:1.3rem">B</span>
                        </div>
                        <h5 class="fw-bold mb-1">BRZ</h5>
                        <small class="text-muted">Brazilian Digital Token — BRL backed</small>
                        <hr>
                        <small class="d-block text-muted">+ No FX risk</small>
                        <small class="d-block text-muted">+ Familiar — you think in reais</small>
                    </div>
                </div>
            </div>
            <div class="d-flex justify-content-between mt-4">
                <button type="button" class="btn btn-outline-secondary px-4 btn-prev"><i class="bi bi-arrow-left me-1"></i>Back</button>
                <button type="button" class="btn btn-gf px-4" id="btn-next-2" disabled>Continue <i class="bi bi-arrow-right ms-1"></i></button>
            </div>
        </div>

        {{-- STEP 3 --}}
        <div class="wizard-panel" id="step-3">
            <h5 class="fw-bold mb-3"><i class="bi bi-calculator me-2" style="color:var(--gf-primary)"></i>Amount and Term</h5>
            <div class="row">
                <div class="col-lg-6">
                    <div class="mb-3 p-3 rounded" style="background:rgba(201,168,76,.06);border:1px solid var(--vx-border-soft)">
                        <div class="d-flex justify-content-between mb-1 small">
                            <span class="text-muted">Asset value</span>
                            <strong id="asset-value-label">—</strong>
                        </div>
                        <div class="d-flex justify-content-between small">
                            <span class="text-muted">Available credit ({{ (int) config('garantifi.lending.max_ltv_pct', 60) }}% LTV ceiling)</span>
                            <strong class="text-gold" id="max-label">—</strong>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold d-flex justify-content-between">
                            <span>Use <span id="slider-pct">100</span>% of available credit</span>
                            <small class="text-muted">Drag to dial down</small>
                        </label>
                        <input type="range" id="inp-ltv" class="form-range" min="0" max="100" value="100" step="1">
                        <div class="d-flex justify-content-between small text-muted">
                            <span>0% — no loan</span>
                            <span>100% — max</span>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Loan amount</label>
                        <div class="input-group">
                            <span class="input-group-text" id="principal-prefix">$</span>
                            <input type="number" class="form-control" id="inp-principal" min="100" step="10" placeholder="0.00">
                        </div>
                        <small class="text-muted">
                            Effective LTV: <strong id="ltv-display">{{ (int) config('garantifi.lending.max_ltv_pct', 60) }}</strong>%
                        </small>
                        <div class="invalid-feedback" id="principal-error" style="display:none">Amount exceeds the available credit ceiling.</div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Term *</label>
                        <select class="form-select" id="inp-term">
                            <option value="3">90 days (3 months)</option>
                            <option value="6">180 days (6 months)</option>
                            <option value="12" selected>12 months</option>
                            <option value="18">18 months</option>
                        </select>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="card p-3" style="border-left:4px solid var(--gf-accent);background:#f8f9fc" id="sim-box">
                        <h6 class="fw-bold mb-2"><i class="bi bi-receipt me-1"></i>Simulation <small class="text-muted">(linear simple interest)</small></h6>
                        <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Principal</span><strong id="sim-principal">—</strong></div>
                        <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Annual rate</span><strong>24% (2400 bps)</strong></div>
                        <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Linear monthly rate</span><strong>2%</strong></div>
                        <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Term</span><strong id="sim-term">—</strong></div>
                        <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Monthly installment</span><strong id="sim-monthly">—</strong></div>
                        <hr class="my-2">
                        <div class="d-flex justify-content-between mb-1 small"><span style="color:#e67e22">Estimated interest</span><strong style="color:#e67e22" id="sim-interest">—</strong></div>
                        <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Origination fee (2.5%)</span><strong class="text-muted" id="sim-origination">—</strong></div>
                        <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Late fee if overdue</span><strong class="text-danger">+1.5% / month</strong></div>
                        <hr class="my-2">
                        <div class="d-flex justify-content-between mb-1 small"><span class="fw-bold">Total to pay at maturity</span><strong style="color:var(--gf-primary);font-size:1.05rem" id="sim-total">—</strong></div>
                        <div class="d-flex justify-content-between mb-1 small"><span class="fw-bold text-success">You receive net</span><strong class="text-success" id="sim-net">—</strong></div>
                        <div class="text-end mt-2"><small class="text-muted" id="sim-other-currency"></small></div>
                    </div>
                </div>
            </div>
            <div class="d-flex justify-content-between mt-4">
                <button type="button" class="btn btn-outline-secondary px-4 btn-prev"><i class="bi bi-arrow-left me-1"></i>Back</button>
                <button type="button" class="btn btn-gf px-4" id="btn-next-3" disabled>Review <i class="bi bi-arrow-right ms-1"></i></button>
            </div>
        </div>

        {{-- STEP 4 --}}
        <div class="wizard-panel" id="step-4">
            <h5 class="fw-bold mb-3"><i class="bi bi-clipboard-check me-2" style="color:var(--gf-primary)"></i>Summary & Confirmation</h5>
            <div class="card p-4 mb-4" style="background:#f8f9fc">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">Collateral</small>
                        <strong id="rev-asset">—</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">Appraised value</small>
                        <strong id="rev-asset-value">—</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">Currency</small>
                        <strong id="rev-currency">—</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">Loan amount</small>
                        <strong id="rev-principal" style="color:var(--gf-accent)">—</strong>
                        <small class="text-muted d-block" id="rev-principal-alt"></small>
                    </div>
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">LTV</small>
                        <strong id="rev-ltv">—</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">Term</small>
                        <strong id="rev-term">—</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">Origination fee</small>
                        <strong id="rev-origination">—</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">Total to pay at maturity</small>
                        <strong id="rev-total" style="color:var(--gf-primary)">—</strong>
                    </div>
                    <div class="col-md-6 mb-3">
                        <small class="text-muted d-block">Monthly installment</small>
                        <strong id="rev-monthly">—</strong>
                    </div>
                </div>
            </div>

            <div class="alert alert-warning small mb-4">
                <h6 class="fw-bold mb-2"><i class="bi bi-exclamation-triangle me-1"></i>Warning — Asset Pledged as Collateral</h6>
                <ul class="mb-0 ps-3">
                    <li>Your asset will be held in <strong>audited custody</strong> and represented on-chain by a TRDC state PDA controlled by the Loan Program.</li>
                    <li>You <strong>cannot</strong> reclaim or transfer the asset while the loan is active.</li>
                    <li>In case of <strong>default</strong>, the protocol may execute liquidation of the collateral.</li>
                    <li>After <strong>full repayment</strong>, the asset is released back to you and the on-chain loan record is marked Repaid.</li>
                </ul>
            </div>

            <div class="d-flex justify-content-between align-items-center">
                <button type="button" class="btn btn-outline-secondary px-4 btn-prev"><i class="bi bi-arrow-left me-1"></i>Back</button>
                <div class="text-end">
                    <div id="wallet-gate-warning" class="text-danger small mb-2 d-none">
                        <i class="bi bi-exclamation-circle me-1"></i>Connect your wallet to continue
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg px-5" id="btn-submit-loan" disabled>
                        <i class="bi bi-pen me-2"></i>Sign and Submit Transaction
                    </button>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    var current = 1;
    var selectedAsset = null;
    var selectedCurrency = null;
    var ORIGINATION_PCT = 2.5;
    var ANNUAL_RATE = 0.24;

    var panels = [1,2,3,4];
    function goTo(step) {
        panels.forEach(function(s) {
            document.getElementById('step-'+s).classList.toggle('active', s===step);
            var ind = document.getElementById('step-ind-'+s);
            ind.classList.remove('active','done');
            if (s < step) ind.classList.add('done');
            else if (s === step) ind.classList.add('active');
        });
        current = step;
    }

    document.querySelectorAll('.btn-prev').forEach(function(btn) {
        btn.addEventListener('click', function() { goTo(current - 1); });
    });

    document.querySelectorAll('.asset-option').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.asset-option').forEach(function(o) { o.classList.remove('selected'); });
            this.classList.add('selected');
            selectedAsset = {
                id: this.dataset.assetId,
                name: this.dataset.assetName,
                valueUsd: parseFloat(this.dataset.assetValue),
                category: this.dataset.assetCategory,
                nft: this.dataset.assetNft
            };
            document.getElementById('f-asset-id').value = selectedAsset.id;
            document.getElementById('btn-next-1').disabled = false;
        });
    });
    document.getElementById('btn-next-1').addEventListener('click', function() {
        if (selectedAsset) goTo(2);
    });

    document.querySelectorAll('.currency-card').forEach(function(el) {
        el.addEventListener('click', function() {
            document.querySelectorAll('.currency-card').forEach(function(o) { o.classList.remove('selected'); });
            this.classList.add('selected');
            selectedCurrency = this.dataset.currency;
            document.getElementById('f-currency').value = selectedCurrency;
            document.getElementById('btn-next-2').disabled = false;
        });
    });

    function refreshRateBadge() {
        var r = GFCurrency.rate();
        var el = document.getElementById('rate-display');
        if (el) el.textContent = r.usdBrl ? r.usdBrl.toFixed(4) : '—';
    }
    GFCurrency.onUpdate(refreshRateBadge);
    refreshRateBadge();

    var MAX_LTV_PCT = {{ (int) config('garantifi.lending.max_ltv_pct', 60) }};

    document.getElementById('btn-next-2').addEventListener('click', function() {
        if (!selectedCurrency) return;
        var assetValue = assetValueInCurrency();
        var ceiling = assetValue * (MAX_LTV_PCT / 100);
        document.getElementById('max-label').textContent = GFCurrency.format(ceiling, selectedCurrency);
        document.getElementById('asset-value-label').textContent = GFCurrency.format(assetValue, selectedCurrency);
        document.getElementById('principal-prefix').textContent = selectedCurrency === 'BRZ' ? 'R$' : '$';
        document.getElementById('inp-principal').max = ceiling;
        // Initialize at 100% of available credit (= MAX_LTV_PCT of asset value)
        inpLtv.value = 100;
        applySliderToPrincipal();
        goTo(3);
    });

    function assetValueInCurrency() {
        if (!selectedAsset) return 0;
        return selectedCurrency === 'BRZ' ? GFCurrency.convert(selectedAsset.valueUsd, 'USDC', 'BRZ') : selectedAsset.valueUsd;
    }

    function ceilingInCurrency() {
        return assetValueInCurrency() * (MAX_LTV_PCT / 100);
    }

    var inpPrincipal = document.getElementById('inp-principal');
    var inpTerm = document.getElementById('inp-term');
    var inpLtv = document.getElementById('inp-ltv');

    // Slider drives principal: principal = (slider%/100) * ceiling
    function applySliderToPrincipal() {
        var ceiling = ceilingInCurrency();
        var sliderPct = parseInt(inpLtv.value);
        var principal = Math.round(ceiling * (sliderPct / 100));
        inpPrincipal.value = principal;
        simulate();
    }

    // Principal input drives slider (sync when user types)
    function applyPrincipalToSlider() {
        var ceiling = ceilingInCurrency();
        var p = parseFloat(inpPrincipal.value) || 0;
        var sliderPct = ceiling > 0 ? Math.min(100, Math.max(0, (p / ceiling) * 100)) : 0;
        inpLtv.value = Math.round(sliderPct);
        simulate();
    }

    inpLtv.addEventListener('input', applySliderToPrincipal);
    inpPrincipal.addEventListener('input', applyPrincipalToSlider);

    function simulate() {
        var assetValue = assetValueInCurrency();
        var ceiling = ceilingInCurrency();
        var p = parseFloat(inpPrincipal.value) || 0;
        var m = parseInt(inpTerm.value);
        var valid = p >= 100 && p <= ceiling;

        inpPrincipal.classList.toggle('is-invalid', p > 0 && p > ceiling);
        document.getElementById('principal-error').style.display = (p > ceiling) ? 'block' : 'none';
        document.getElementById('btn-next-3').disabled = !valid;

        var interest = p * (ANNUAL_RATE / 12) * m;
        var origination = p * (ORIGINATION_PCT / 100);
        var total = p + interest;
        var net = p - origination;
        var sliderPct = parseInt(inpLtv.value);
        var effectiveLtv = assetValue > 0 ? (p / assetValue * 100) : 0;
        document.getElementById('slider-pct').textContent = sliderPct;
        document.getElementById('ltv-display').textContent = effectiveLtv.toFixed(0);

        document.getElementById('sim-principal').textContent = p > 0 ? GFCurrency.format(p, selectedCurrency) : '—';
        document.getElementById('sim-term').textContent = m + ' months';
        // Monthly installment under linear simple interest = (principal + total interest) / months.
        // Mirrors what InterestCalculator::linearSchedule produces in PHP — every parcel equal.
        var monthly = (p > 0 && m > 0) ? (total / m) : 0;
        document.getElementById('sim-monthly').textContent = monthly > 0 ? GFCurrency.format(monthly, selectedCurrency) : '—';
        document.getElementById('sim-interest').textContent = GFCurrency.format(interest, selectedCurrency);
        document.getElementById('sim-origination').textContent = GFCurrency.format(origination, selectedCurrency);
        document.getElementById('sim-total').textContent = GFCurrency.format(total, selectedCurrency);
        document.getElementById('sim-net').textContent = GFCurrency.format(net, selectedCurrency);
        if (p > 0) {
            var other = selectedCurrency === 'USDC' ? 'BRZ' : 'USDC';
            var converted = GFCurrency.convert(total, selectedCurrency, other);
            document.getElementById('sim-other-currency').textContent = '≈ ' + GFCurrency.format(converted, other) + ' (current FX)';
        }
    }
    inpTerm.addEventListener('change', simulate);

    document.getElementById('btn-next-3').addEventListener('click', function() {
        var assetValue = assetValueInCurrency();
        var p = parseFloat(inpPrincipal.value);
        var m = parseInt(inpTerm.value);
        if (p < 100 || p > assetValue) return;

        document.getElementById('f-principal').value = selectedCurrency === 'BRZ' ? GFCurrency.convert(p, 'BRZ', 'USDC').toFixed(2) : p;
        document.getElementById('f-term').value = m;

        var interest = p * (ANNUAL_RATE / 12) * m;
        var origination = p * (ORIGINATION_PCT / 100);
        var total = p + interest;
        var ltvPct = assetValue > 0 ? (p / assetValue * 100) : 0;
        var other = selectedCurrency === 'USDC' ? 'BRZ' : 'USDC';

        document.getElementById('rev-asset').textContent = selectedAsset.name + ' (' + selectedAsset.category + ')';
        document.getElementById('rev-asset-value').textContent = GFCurrency.format(assetValue, selectedCurrency);
        document.getElementById('rev-currency').textContent = selectedCurrency;
        document.getElementById('rev-principal').textContent = GFCurrency.format(p, selectedCurrency);
        document.getElementById('rev-principal-alt').textContent = '≈ ' + GFCurrency.format(GFCurrency.convert(p, selectedCurrency, other), other);
        document.getElementById('rev-ltv').textContent = ltvPct.toFixed(1) + '%';
        document.getElementById('rev-term').textContent = m + ' months';
        document.getElementById('rev-origination').textContent = GFCurrency.format(origination, selectedCurrency) + ' (' + ORIGINATION_PCT + '%)';
        document.getElementById('rev-total').textContent = GFCurrency.format(total, selectedCurrency);
        var revMonthly = m > 0 ? (total / m) : 0;
        document.getElementById('rev-monthly').textContent = revMonthly > 0 ? GFCurrency.format(revMonthly, selectedCurrency) : '—';

        goTo(4);
        updateWalletGate();
    });

    function updateWalletGate() {
        var btn = document.getElementById('btn-submit-loan');
        var warn = document.getElementById('wallet-gate-warning');
        if (typeof GFWallet !== 'undefined' && GFWallet.isConnected()) {
            btn.disabled = false;
            warn.classList.add('d-none');
        } else {
            btn.disabled = true;
            warn.classList.remove('d-none');
        }
    }
    document.addEventListener('walletConnected', updateWalletGate);
    document.addEventListener('walletDisconnected', updateWalletGate);

    var form = document.getElementById('loanForm');
    form.addEventListener('submit', async function(ev) {
        ev.preventDefault();
        var btn = document.getElementById('btn-submit-loan');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing...';

        try {
            var result = await GFWallet.signLoanRequest({
                assetId: document.getElementById('f-asset-id').value,
                currency: document.getElementById('f-currency').value,
                amount: document.getElementById('f-principal').value,
                termMonths: document.getElementById('f-term').value
            });
            if (result && result.txHash) {
                var txInput = document.createElement('input');
                txInput.type = 'hidden';
                txInput.name = 'tx_hash';
                txInput.value = result.txHash;
                form.appendChild(txInput);
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting to backend...';
                GFToast.success('Transaction signed. Recording loan...');
                form.submit();
            }
        } catch(e) {
            console.warn(e);
            GFToast.danger('Signing failed: ' + (e.message || 'rejected by wallet'));
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-pen me-2"></i>Sign and Submit Transaction';
        }
    });
});
</script>
@endpush

@if(!empty($demoFill))
    {{-- Demo autofill: drives the wizard step-by-step (click asset → next →
         pick USDC → next → set principal+term → review). On submit, we
         bypass the wallet-sign submit handler entirely by calling
         `loanForm.submit()` directly — `form.submit()` from JS does NOT
         fire the registered submit event listener, so we skip the
         GFWallet.signLoanRequest path (which would block without a
         connected wallet) and let the server-side route handle the
         create_ccb_trdc call through the bridge. --}}
    @push('scripts')
    <script>
    (function () {
        const FAST       = {{ !empty($demoFast) ? 'true' : 'false' }};
        const NO_SUBMIT  = {{ !empty($demoNoSubmit) ? 'true' : 'false' }};
        const STEP_GAP_MS  = FAST ? 80 : 900;
        const FINAL_PAUSE_MS = FAST ? 200 : 1500;

        const PRINCIPAL = '8250';
        const TERM      = '3';

        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        async function run() {
            await sleep(FAST ? 100 : 600);

            // Step 1 — select first asset card
            const card = document.querySelector('.asset-option');
            if (!card) { console.warn('[demo-fill loan] no asset available'); return; }
            card.click();
            await sleep(STEP_GAP_MS);
            const next1 = document.getElementById('btn-next-1');
            if (next1) next1.click();

            // Step 2 — USDC
            await sleep(STEP_GAP_MS);
            const usdc = document.querySelector('.currency-card[data-currency="USDC"]');
            if (usdc) usdc.click();
            await sleep(STEP_GAP_MS);
            const next2 = document.getElementById('btn-next-2');
            if (next2) next2.click();

            // Step 3 — principal + term (slider listener picks up input event)
            await sleep(STEP_GAP_MS);
            const principalInput = document.getElementById('inp-principal');
            if (principalInput) {
                principalInput.value = PRINCIPAL;
                principalInput.dispatchEvent(new Event('input', { bubbles: true }));
                principalInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const termSelect = document.getElementById('inp-term');
            if (termSelect) {
                termSelect.value = TERM;
                termSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            await sleep(STEP_GAP_MS);
            const next3 = document.getElementById('btn-next-3');
            if (next3) next3.click();

            // Step 4 — submit. Calling form.submit() programmatically does
            // NOT trigger the registered 'submit' event listener (which
            // would route through GFWallet.signLoanRequest and block
            // without a connected wallet). So we skip the wallet sign step
            // and let the server take it.
            await sleep(FINAL_PAUSE_MS);
            if (!NO_SUBMIT) {
                const form = document.getElementById('loanForm');
                if (form) form.submit();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    })();
    </script>
    @endpush
@endif
