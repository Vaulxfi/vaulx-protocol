@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'BRZ Depeg Monitor')
@section('page-subtitle')
    Checks every 5 minutes via Jupiter Price API + AwesomeAPI
    <span class="badge bg-info ms-1">{{ strtoupper(config('garantifi.network')) }}</span>
@endsection
@section('page-actions')
    <span class="badge bg-success px-2 py-1" id="monitor-status-badge">
        <span style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;animation:pulse-dot 2s infinite;vertical-align:middle" class="me-1"></span>
        Monitoring
    </span>
    <button class="btn btn-outline-primary btn-sm ms-2" id="btn-refresh-now"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>
@endsection

@section('panel-content')
<div class="row g-3 mb-4">
    <div class="col-md-3">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">BRZ / USD</small>
            <h4 class="fw-bold mb-1" id="m-brz-usd">—</h4>
            <small class="text-muted"><i class="bi bi-arrow-repeat me-1"></i>Jupiter Price API</small>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">USD / BRL</small>
            <h4 class="fw-bold mb-1" id="m-usd-brl">—</h4>
            <small class="text-muted"><i class="bi bi-bank me-1"></i>AwesomeAPI / BACEN</small>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">BRZ / BRL</small>
            <h4 class="fw-bold mb-1" id="m-brz-brl">—</h4>
            <small class="text-muted"><i class="bi bi-calculator me-1"></i>Computed pair</small>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3 h-100" id="m-depeg-card" style="border-left:4px solid #2ecc71">
            <small class="text-muted d-block">DEPEG</small>
            <h4 class="fw-bold mb-1" id="m-depeg">—</h4>
            <small id="m-tier-label">—</small>
        </div>
    </div>
</div>

<div class="card p-4 mb-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-shield-exclamation me-2" style="color:var(--gf-primary)"></i>Response Policy by Tier</h5>
    <div class="d-flex flex-column gap-2" id="tier-list">
        <div class="d-flex align-items-center justify-content-between p-3 rounded tier-row" data-tier="normal">
            <div class="d-flex align-items-center">
                <span class="tier-dot me-3"></span>
                <div>
                    <strong class="me-3" style="font-family:'Courier New',monospace;min-width:80px;display:inline-block">&plusmn;1%</strong>
                    <span>Normal operation</span>
                </div>
            </div>
            <span class="badge bg-secondary px-2 py-1 tier-badge">STANDBY</span>
        </div>
        <div class="d-flex align-items-center justify-content-between p-3 rounded tier-row" data-tier="alert">
            <div class="d-flex align-items-center">
                <span class="tier-dot me-3"></span>
                <div>
                    <strong class="me-3" style="font-family:'Courier New',monospace;min-width:80px;display:inline-block">-1% to -3%</strong>
                    <span>Alert. New BRZ loans paused preventively</span>
                </div>
            </div>
            <span class="badge bg-secondary px-2 py-1 tier-badge">STANDBY</span>
        </div>
        <div class="d-flex align-items-center justify-content-between p-3 rounded tier-row" data-tier="paused">
            <div class="d-flex align-items-center">
                <span class="tier-dot me-3"></span>
                <div>
                    <strong class="me-3" style="font-family:'Courier New',monospace;min-width:80px;display:inline-block">Below -3%</strong>
                    <span>Automatic <code>pause_vault</code> BRZ</span>
                </div>
            </div>
            <span class="badge bg-secondary px-2 py-1 tier-badge">STANDBY</span>
        </div>
        <div class="d-flex align-items-center justify-content-between p-3 rounded tier-row" data-tier="convert">
            <div class="d-flex align-items-center">
                <span class="tier-dot me-3"></span>
                <div>
                    <strong class="me-3" style="font-family:'Courier New',monospace;min-width:80px;display:inline-block">Below -5%</strong>
                    <span>Offer conversion to USDC</span>
                </div>
            </div>
            <span class="badge bg-secondary px-2 py-1 tier-badge">STANDBY</span>
        </div>
    </div>
</div>

<div class="card p-4 mb-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-graph-up me-2" style="color:var(--gf-primary)"></i>Depeg trend (last 24 readings)</h5>
    <div style="height:240px"><canvas id="depeg-chart"></canvas></div>
</div>

<div class="card p-4 mb-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-clock-history me-2" style="color:var(--gf-primary)"></i>Reading history</h5>
    <div class="table-responsive">
        <table class="table table-sm align-middle mb-0">
            <thead><tr><th>Time</th><th>BRZ/USD</th><th>BRZ/BRL</th><th>Depeg</th><th>Tier</th></tr></thead>
            <tbody id="history-body">
                @for($i = 0; $i < 5; $i++)
                <tr>
                    <td><div class="skeleton skeleton-line sm"></div></td>
                    <td><div class="skeleton skeleton-line sm"></div></td>
                    <td><div class="skeleton skeleton-line sm"></div></td>
                    <td><div class="skeleton skeleton-line sm"></div></td>
                    <td><div class="skeleton skeleton-line sm"></div></td>
                </tr>
                @endfor
            </tbody>
        </table>
    </div>
</div>

<div class="card p-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-braces me-2" style="color:var(--gf-primary)"></i>Calculation Formula</h5>
    <div class="rounded p-4" style="background:#1a1528;font-family:'Courier New',monospace;font-size:.85rem;line-height:1.8">
        <div><span style="color:#c792ea">const</span> <span style="color:var(--gf-accent)">brz_usd</span> = <span style="color:#82aaff">getBRZPrice</span>()  <span style="color:#546e7a">// Jupiter Price API</span></div>
        <div><span style="color:#c792ea">const</span> <span style="color:var(--gf-accent)">brl_usd</span> = <span style="color:#82aaff">fetchBACEN</span>()   <span style="color:#546e7a">// or AwesomeAPI</span></div>
        <div style="margin-top:.5rem"><span style="color:#c792ea">const</span> <span style="color:#f78c6c">brz_brl</span> = <span style="color:var(--gf-accent)">brz_usd</span> * <span style="color:var(--gf-accent)">brl_usd</span></div>
        <div><span style="color:#c792ea">const</span> <span style="color:#f78c6c">depeg</span>   = (<span style="color:#f78c6c">brz_brl</span> - <span style="color:#f78c6c">1.0</span>) * <span style="color:#f78c6c">100</span>  <span style="color:#546e7a">// % deviation from 1:1 peg</span></div>
    </div>
</div>
@endsection

@push('styles')
<style>
.tier-row { background:#f8f9fc; border:1px solid #e9ecef; opacity:.55; transition:all .2s; }
.tier-row.active { opacity:1; background:rgba(46,204,113,.08); border-color:rgba(46,204,113,.3); }
.tier-row.active[data-tier="alert"] { background:rgba(243,156,18,.08); border-color:rgba(243,156,18,.3); }
.tier-row.active[data-tier="paused"] { background:rgba(231,76,60,.08); border-color:rgba(231,76,60,.3); }
.tier-row.active[data-tier="convert"] { background:rgba(192,57,43,.1); border-color:rgba(192,57,43,.4); }
[data-bs-theme="dark"] .tier-row { background:rgba(255,255,255,.03); border-color:rgba(255,255,255,.08); }
.tier-dot { width:10px;height:10px;border-radius:50%;background:#adb5bd;display:inline-block; }
.tier-row.active .tier-dot { background:#2ecc71; }
.tier-row[data-tier="alert"].active .tier-dot { background:#f39c12; }
.tier-row[data-tier="paused"].active .tier-dot { background:#e74c3c; }
.tier-row[data-tier="convert"].active .tier-dot { background:#c0392b; }
</style>
@endpush

@push('scripts')
@vite(['resources/js/pages/monitor-brz.js'])
@endpush
