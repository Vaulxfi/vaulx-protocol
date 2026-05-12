@extends('layouts.app')
@section('title', 'Simulator')

@section('content')
<div class="container py-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">Loan Simulator</h2>
        <p class="text-muted">Find out how much you can borrow using your assets as collateral</p>
    </div>

    {{-- LIVE CAPACITY — vault TVL on devnet, refreshed server-side every 60s. Hidden when the bridge is offline or the vault isn't initialized. --}}
    @if (isset($onchain) && ($onchain['vault']['ok'] ?? false))
        @php $v = $onchain['vault']['data']['fields'] ?? []; @endphp
        <div class="text-center mb-5">
            <span class="pitch-line" style="display:inline-block;padding:0.4rem 1.1rem;border:1px solid var(--vx-border-soft);border-radius:999px">
                <span style="color:var(--vx-accent-mark)">●</span>
                <span class="ms-2 small">live ·
                    <strong>{{ number_format(($v['total_assets'] ?? 0) / 1_000_000, 0) }} USDC</strong>
                    available right now ·
                    <span class="text-muted">refreshed {{ $onchain['fetched_at'] }}</span>
                </span>
            </span>
        </div>
    @endif

    <div class="row justify-content-center">
        <div class="col-lg-5">
            <div class="card card-accent p-4">
                <h5 class="fw-bold mb-3"><i class="bi bi-sliders me-2" style="color:var(--gf-primary)"></i>Parameters</h5>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Asset category</label>
                    <select id="sim-category" class="form-select">
                        <option value="watch">Watch</option>
                        <option value="jewelry">Jewelry</option>
                        <option value="art">Art</option>
                        <option value="vehicle">Vehicle</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Disbursement currency</label>
                    <div class="btn-group w-100" role="group">
                        <input type="radio" class="btn-check" name="currency" id="cur-usdc" value="USDC" checked>
                        <label class="btn btn-outline-secondary" for="cur-usdc">USDC ($)</label>
                        <input type="radio" class="btn-check" name="currency" id="cur-brz" value="BRZ">
                        <label class="btn btn-outline-secondary" for="cur-brz">BRZ (R$)</label>
                    </div>
                    <small class="text-muted">FX USD/BRL: R$ <span id="rate-badge">—</span></small>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Estimated asset value (<span id="value-suffix">USD</span>)</label>
                    <div class="input-group">
                        <span class="input-group-text" id="value-prefix">$</span>
                        <input type="number" id="sim-value" class="form-control" value="15000" min="1000" step="500">
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">LTV: <span id="ltv-display">55</span>%</label>
                    <input type="range" id="sim-ltv" class="form-range" min="20" max="90" value="55" step="1">
                    <div class="d-flex justify-content-between small text-muted">
                        <span>20% (conservative)</span>
                        <span>90% (aggressive)</span>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Annual interest rate: <span id="rate-display">24</span>%</label>
                    <input type="range" id="sim-rate" class="form-range" min="12" max="36" value="24" step="1">
                    <small class="text-muted">Model: linear simple interest (spec §3)</small>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Term</label>
                    <select id="sim-term" class="form-select">
                        <option value="3">3 months</option>
                        <option value="6">6 months</option>
                        <option value="12" selected>12 months</option>
                        <option value="18">18 months</option>
                        <option value="24">24 months</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="col-lg-5">
            <div class="card card-accent accent p-4 mb-4">
                <h5 class="fw-bold mb-3"><i class="bi bi-calculator me-2" style="color:var(--gf-accent)"></i>Result</h5>

                <div class="row g-3">
                    <div class="col-6">
                        <small class="text-muted d-block">Asset value</small>
                        <strong class="fs-5" id="res-asset">—</strong>
                        <small class="text-muted d-block" id="res-asset-alt">—</small>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Credit disbursed</small>
                        <strong class="fs-5" style="color:var(--gf-accent)" id="res-principal">—</strong>
                        <small class="text-muted d-block" id="res-principal-alt">—</small>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Origination fee (2.5%)</small>
                        <strong id="res-origination">—</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">You receive net</small>
                        <strong style="color:var(--gf-primary)" id="res-net">—</strong>
                    </div>
                </div>

                <hr>

                <div class="row g-3">
                    <div class="col-6">
                        <small class="text-muted d-block">Monthly payment (linear)</small>
                        <strong class="fs-5" id="res-monthly">—</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Total to pay</small>
                        <strong class="fs-5" id="res-total">—</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Total interest</small>
                        <strong id="res-interest">—</strong>
                    </div>
                    <div class="col-6">
                        <small class="text-muted d-block">Effective total cost (CET)</small>
                        <strong id="res-cet">—</strong>
                    </div>
                </div>
            </div>

            <div class="card p-4">
                <h6 class="fw-bold mb-3"><i class="bi bi-bar-chart me-2"></i>Schedule (linear installments)</h6>
                <div style="max-height:250px; overflow-y:auto">
                    <table class="table table-sm small" id="installments-table">
                        <thead class="table-light sticky-top">
                            <tr><th>#</th><th>Principal</th><th>Interest</th><th>Payment</th><th>Balance</th></tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>

            <div class="text-center mt-4">
                <a href="{{ route('register') }}" class="btn btn-gf-accent btn-lg px-5">Request Loan</a>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    var $ = function(id) { return document.getElementById(id); };

    // Category → sensible default USD asset value
    var CATEGORY_PRESETS = {
        watch:   8000,
        jewelry: 12000,
        art:     25000,
        vehicle: 35000
    };

    function currentCurrency() {
        return document.querySelector('input[name="currency"]:checked').value;
    }

    function fmt(n, c) {
        return GFCurrency.format(n, c || currentCurrency());
    }

    function refreshBadge() {
        var r = GFCurrency.rate();
        $('rate-badge').textContent = r.usdBrl ? r.usdBrl.toFixed(4) : '—';
    }

    function applyCurrencyChrome() {
        var c = currentCurrency();
        $('value-prefix').textContent = c === 'BRZ' ? 'R$' : '$';
        $('value-suffix').textContent = c === 'BRZ' ? 'BRL' : 'USD';
    }

    function calculate() {
        var currency = currentCurrency();
        var other = currency === 'USDC' ? 'BRZ' : 'USDC';
        var assetValue = parseFloat($('sim-value').value) || 0;
        var ltv = parseFloat($('sim-ltv').value) / 100;
        var annualRate = parseFloat($('sim-rate').value) / 100;
        var months = parseInt($('sim-term').value);
        var originationPct = 0.025;

        var principal = assetValue * ltv;
        var originationFee = principal * originationPct;
        var netAmount = principal - originationFee;

        var monthlyInterest = principal * annualRate / 12;
        var monthly = (principal / months) + monthlyInterest;
        var totalInterest = monthlyInterest * months;
        var totalPaid = principal + totalInterest;
        var cet = principal > 0 ? ((totalPaid + originationFee) / principal - 1) * 100 : 0;

        $('ltv-display').textContent = $('sim-ltv').value;
        $('rate-display').textContent = $('sim-rate').value;
        $('res-asset').textContent = fmt(assetValue);
        $('res-asset-alt').textContent = '≈ ' + fmt(GFCurrency.convert(assetValue, currency, other), other);
        $('res-principal').textContent = fmt(principal);
        $('res-principal-alt').textContent = '≈ ' + fmt(GFCurrency.convert(principal, currency, other), other);
        $('res-origination').textContent = fmt(originationFee);
        $('res-net').textContent = fmt(netAmount);
        $('res-monthly').textContent = fmt(monthly);
        $('res-total').textContent = fmt(totalPaid);
        $('res-interest').textContent = fmt(totalInterest);
        $('res-cet').textContent = cet.toFixed(1) + '%';

        var tbody = $('installments-table').querySelector('tbody');
        tbody.innerHTML = '';
        var principalPortion = principal / months;
        var balance = principal;
        for (var i = 1; i <= months; i++) {
            var isLast = (i === months);
            var pp = isLast ? balance : principalPortion;
            balance = Math.max(0, balance - pp);
            tbody.innerHTML += '<tr>' +
                '<td>' + i + '</td>' +
                '<td>' + fmt(pp) + '</td>' +
                '<td>' + fmt(monthlyInterest) + '</td>' +
                '<td>' + fmt(pp + monthlyInterest) + '</td>' +
                '<td>' + fmt(balance) + '</td>' +
                '</tr>';
        }
    }

    ['sim-value', 'sim-ltv', 'sim-rate', 'sim-term'].forEach(function(id) {
        $(id).addEventListener('input', calculate);
    });
    $('sim-category').addEventListener('change', function() {
        var cat = this.value;
        var preset = CATEGORY_PRESETS[cat];
        if (preset) {
            var currency = currentCurrency();
            var value = currency === 'BRZ' ? GFCurrency.convert(preset, 'USDC', 'BRZ') : preset;
            $('sim-value').value = Math.round(value);
        }
        calculate();
    });
    document.querySelectorAll('input[name="currency"]').forEach(function(el) {
        el.addEventListener('change', function() {
            applyCurrencyChrome();
            var current = parseFloat($('sim-value').value) || 0;
            var newC = currentCurrency();
            var oldC = newC === 'USDC' ? 'BRZ' : 'USDC';
            if (current > 0) {
                $('sim-value').value = GFCurrency.convert(current, oldC, newC).toFixed(2);
            }
            calculate();
        });
    });

    GFCurrency.onUpdate(function() { refreshBadge(); calculate(); });
    applyCurrencyChrome();
    refreshBadge();
    calculate();
});
</script>
@endpush
