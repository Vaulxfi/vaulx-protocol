@extends('layouts.panel')
@section('sidebar') @include('borrower.sidebar') @endsection
@section('page-title', 'Re-loan against ' . $asset->brand . ' ' . $asset->model)
@section('page-subtitle', 'One-click — asset already evaluated. Skip the wizard.')

@section('panel-content')
<div class="row g-4">
    <div class="col-lg-7">
        <div class="card card-accent accent p-4 mb-4">
            <h5 class="fw-bold mb-3"><i class="bi bi-lightning-fill me-2 text-amber"></i>Express re-loan</h5>
            <p class="text-muted mb-3">
                You repaid <strong>{{ $previousLoan->code }}</strong> on
                <strong>{{ optional($previousLoan->repaid_at)->format(config('app.date_format')) }}</strong>.
                Because <strong>{{ $asset->brand }} {{ $asset->model }}</strong> was already evaluated
                ({{ optional($asset->appraisal_date)->format(config('app.date_format')) }} ·
                <x-money :amount="$asset->appraised_value" />), we skip the evaluator queue and the
                physical inspection. Your re-loan only needs custody confirmation by the admin.
            </p>

            <form method="POST" action="{{ route('borrower.reloan.store', $asset) }}" id="reloanForm">
                @csrf

                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label fw-semibold" for="currency">Currency</label>
                        <select name="currency" id="currency" class="form-select">
                            <option value="USDC" {{ $defaults['currency'] === 'USDC' ? 'selected' : '' }}>USDC ($)</option>
                            <option value="BRZ" {{ $defaults['currency'] === 'BRZ' ? 'selected' : '' }}>BRZ (R$)</option>
                        </select>
                        <small class="text-muted">Last loan: {{ $previousLoan->currency }}</small>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold" for="term_months">Term</label>
                        <select name="term_months" id="term_months" class="form-select">
                            @foreach([3, 6, 12, 18] as $t)
                                <option value="{{ $t }}" {{ $defaults['term'] === $t ? 'selected' : '' }}>{{ $t }} months</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                @php
                    $maxLtvPct = (int) config('garantifi.lending.max_ltv_pct', 60);
                    $ceilingUsdc = (float) $asset->appraised_value * ($maxLtvPct / 100);
                @endphp

                <div class="mt-3 p-3 rounded" style="background:rgba(201,168,76,.06);border:1px solid var(--vx-border-soft)">
                    <div class="d-flex justify-content-between mb-1 small">
                        <span class="text-muted">Asset value</span>
                        <strong><x-money :amount="$asset->appraised_value" /></strong>
                    </div>
                    <div class="d-flex justify-content-between small">
                        <span class="text-muted">Available credit ({{ $maxLtvPct }}% LTV ceiling)</span>
                        <strong class="text-gold"><x-money :amount="$ceilingUsdc" /></strong>
                    </div>
                </div>

                <div class="mt-3">
                    <label class="form-label fw-semibold d-flex justify-content-between" for="ltv-slider">
                        <span>Use <span id="slider-pct">100</span>% of available credit</span>
                        <small class="text-muted">Drag to dial down</small>
                    </label>
                    <input type="range" id="ltv-slider" class="form-range" min="0" max="100" value="100" step="1">
                    <div class="d-flex justify-content-between small text-muted">
                        <span>0% — no loan</span>
                        <span>100% — max</span>
                    </div>
                </div>

                <div class="mt-3">
                    <label class="form-label fw-semibold" for="principal">Loan amount</label>
                    <div class="input-group">
                        <span class="input-group-text" id="principal-prefix">{{ $defaults['currency'] === 'BRZ' ? 'R$' : '$' }}</span>
                        <input type="number" name="principal" id="principal" class="form-control"
                               value="{{ round($ceilingUsdc, 2) }}" min="100" step="10"
                               max="{{ round($ceilingUsdc, 2) }}" required>
                    </div>
                </div>

                <div class="card p-3 mt-3" style="background:var(--vx-surface-2);border-left:3px solid var(--vx-gold)">
                    <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Annual rate</span><strong>24% (linear)</strong></div>
                    <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Origination (2.5%)</span><strong id="rl-origination">—</strong></div>
                    <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Interest over term</span><strong id="rl-interest">—</strong></div>
                    <hr class="my-2">
                    <div class="d-flex justify-content-between"><span class="fw-bold">Net you receive</span><strong class="text-gold" id="rl-net">—</strong></div>
                    <div class="d-flex justify-content-between"><span class="fw-bold">Total to pay back</span><strong style="color:var(--vx-amber)" id="rl-total">—</strong></div>
                </div>

                <div class="alert alert-info mt-3 small">
                    <i class="bi bi-info-circle me-1"></i>
                    Re-loan skips the 6-24h evaluation queue. After admin confirms custody (your asset is still tracked),
                    the disbursement happens within hours — not days.
                </div>

                <div class="d-flex justify-content-between align-items-center mt-4">
                    <a href="{{ route('borrower.dashboard') }}" class="btn btn-outline-secondary">Cancel</a>
                    <div class="text-end">
                        <div id="wallet-gate-warning" class="text-amber small mb-2 d-none">
                            <i class="bi bi-exclamation-circle me-1"></i>Connect your wallet to sign
                        </div>
                        <button type="submit" class="btn btn-gf-accent btn-lg" id="btn-submit-reloan" disabled>
                            <i class="bi bi-pen me-2"></i>Sign & Request re-loan
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <div class="col-lg-5">
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-box-seam me-1 text-gold"></i>Asset history</h6>
            <strong>{{ $asset->brand }} {{ $asset->model }}</strong>
            <small class="text-muted d-block">{{ $asset->category_label }}</small>
            <hr>
            <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Appraised value</span><strong><x-money :amount="$asset->appraised_value" /></strong></div>
            <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Appraised on</span><strong>{{ optional($asset->appraisal_date)->format(config('app.date_format')) }}</strong></div>
            <div class="d-flex justify-content-between mb-1 small"><span class="text-muted">Custody</span><strong>{{ $asset->custody_status_label }}</strong></div>
        </div>

        <div class="card p-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-clock-history me-1 text-gold"></i>Previous loan</h6>
            <small class="text-muted d-block">Code</small>
            <strong class="d-block mb-2">{{ $previousLoan->code }}</strong>
            <small class="text-muted d-block">Principal · LTV · Term</small>
            <strong class="d-block mb-2">
                {{ $previousLoan->formatAmount($previousLoan->principal) }} ·
                {{ $previousLoan->ltv_percent }}% ·
                {{ $previousLoan->term_months }}m
            </strong>
            <small class="text-muted d-block">Repaid on</small>
            <strong>{{ optional($previousLoan->repaid_at)->format(config('app.date_format')) }}</strong>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    var ASSET_VALUE = {{ (float) $asset->appraised_value }};
    var MAX_LTV_PCT = {{ (int) config('garantifi.lending.max_ltv_pct', 60) }};
    var CEILING_USDC = ASSET_VALUE * (MAX_LTV_PCT / 100);
    var inpPrincipal = document.getElementById('principal');
    var inpCurrency = document.getElementById('currency');
    var inpTerm = document.getElementById('term_months');
    var slider = document.getElementById('ltv-slider');
    var btn = document.getElementById('btn-submit-reloan');
    var warn = document.getElementById('wallet-gate-warning');

    function ceilingInCurrency() {
        return inpCurrency.value === 'BRZ'
            ? GFCurrency.convert(CEILING_USDC, 'USDC', 'BRZ')
            : CEILING_USDC;
    }

    function applySliderToPrincipal() {
        var ceiling = ceilingInCurrency();
        var pct = parseInt(slider.value);
        inpPrincipal.value = Math.round(ceiling * (pct / 100));
        document.getElementById('slider-pct').textContent = pct;
        inpPrincipal.max = ceiling;
        recalc();
    }

    function applyPrincipalToSlider() {
        var ceiling = ceilingInCurrency();
        var p = parseFloat(inpPrincipal.value) || 0;
        var pct = ceiling > 0 ? Math.min(100, Math.max(0, (p / ceiling) * 100)) : 0;
        slider.value = Math.round(pct);
        document.getElementById('slider-pct').textContent = Math.round(pct);
        recalc();
    }

    slider.addEventListener('input', applySliderToPrincipal);
    inpPrincipal.addEventListener('input', applyPrincipalToSlider);
    inpCurrency.addEventListener('change', applySliderToPrincipal);

    function recalc() {
        var p = parseFloat(inpPrincipal.value) || 0;
        var m = parseInt(inpTerm.value);
        var c = inpCurrency.value;
        var origination = p * 0.025;
        var interest = p * 0.24 / 12 * m;
        var net = p - origination;
        var total = p + interest;

        document.getElementById('principal-prefix').textContent = c === 'BRZ' ? 'R$' : '$';
        document.getElementById('rl-origination').textContent = GFCurrency.format(origination, c);
        document.getElementById('rl-interest').textContent = GFCurrency.format(interest, c);
        document.getElementById('rl-net').textContent = GFCurrency.format(net, c);
        document.getElementById('rl-total').textContent = GFCurrency.format(total, c);
    }
    inpTerm.addEventListener('change', recalc);
    applySliderToPrincipal();
    recalc();

    function gate() {
        if (typeof GFWallet !== 'undefined' && GFWallet.isConnected()) {
            btn.disabled = false; warn.classList.add('d-none');
        } else {
            btn.disabled = true; warn.classList.remove('d-none');
        }
    }
    document.addEventListener('walletConnected', gate);
    document.addEventListener('walletDisconnected', gate);
    gate();

    document.getElementById('reloanForm').addEventListener('submit', async function(ev) {
        ev.preventDefault();
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing...';
        try {
            var result = await GFWallet.signLoanRequest({
                assetId: {{ $asset->id }},
                currency: inpCurrency.value,
                amount: inpPrincipal.value,
                termMonths: inpTerm.value
            });
            if (result && result.txHash) {
                var hidden = document.createElement('input');
                hidden.type = 'hidden'; hidden.name = 'tx_hash'; hidden.value = result.txHash;
                ev.target.appendChild(hidden);
                ev.target.submit();
            }
        } catch(e) {
            GFToast.danger('Sign failed: ' + (e.message || 'rejected'));
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-pen me-2"></i>Sign & Request re-loan';
        }
    });
});
</script>
@endpush
