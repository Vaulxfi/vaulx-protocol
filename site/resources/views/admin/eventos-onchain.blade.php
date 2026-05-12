@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'On-chain Events (onLogs)')
@section('page-subtitle')
    <code style="font-size:.8rem;color:var(--gf-accent)">connection.onLogs(LOAN_PROGRAM_ID, callback)</code>
    <span class="badge bg-info ms-1">{{ strtoupper(config('garantifi.network')) }}</span>
@endsection
@section('page-actions')
    <span class="badge bg-success px-2 py-1" id="ws-status">
        <span style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;animation:pulse-dot 2s infinite;vertical-align:middle" class="me-1"></span>
        Subscriber active
    </span>
@endsection

@section('panel-content')
<div class="card p-4 mb-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-broadcast me-2" style="color:var(--gf-primary)"></i>Event Feed</h5>
    <div id="events-feed" class="d-flex flex-column gap-0">
        @for($i = 0; $i < 5; $i++)
        <div class="d-flex align-items-center gap-3 py-3 border-bottom">
            <div class="skeleton skeleton-line sm" style="width:70px"></div>
            <div class="skeleton skeleton-line" style="width:145px;height:22px"></div>
            <div class="skeleton skeleton-line sm" style="width:85px"></div>
            <div class="skeleton skeleton-line sm flex-grow-1"></div>
        </div>
        @endfor
    </div>

    <hr>
    <div>
        <small class="text-muted me-2">Monitored events:</small>
        <span class="badge rounded-pill px-2 py-1 me-1" style="background:#2ecc71;font-size:.75rem">LoanRepaid</span>
        <span class="badge rounded-pill px-2 py-1 me-1" style="background:#e74c3c;font-size:.75rem">LoanDefaulted</span>
        <span class="badge rounded-pill px-2 py-1 me-1" style="background:#3498db;font-size:.75rem">CustodyConfirmed</span>
        <span class="badge rounded-pill px-2 py-1 me-1" style="background:var(--gf-primary);font-size:.75rem">DisburseCompleted</span>
        <span class="badge rounded-pill px-2 py-1" style="background:#f39c12;font-size:.75rem">MarkOverdue</span>
    </div>
</div>

<div class="row g-3 mb-4">
    <div class="col-md-3">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">Last processed slot</small>
            <h4 class="fw-bold mb-1" style="font-family:'Courier New',monospace;font-size:1.1rem" id="last-slot">—</h4>
            <small class="text-muted"><i class="bi bi-database me-1"></i>Persisted in DB</small>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">Events today</small>
            <h4 class="fw-bold mb-1" id="events-today">—</h4>
            <small class="text-muted"><i class="bi bi-calendar me-1"></i>Since 00:00</small>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">Reconnects</small>
            <h4 class="fw-bold mb-1 text-success">0</h4>
            <small class="text-muted"><i class="bi bi-arrow-repeat me-1"></i>Last 24h</small>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">Missed events</small>
            <h4 class="fw-bold mb-1 text-success">0</h4>
            <small class="text-muted"><i class="bi bi-check-circle me-1"></i>Auto-catchup</small>
        </div>
    </div>
</div>

<div class="card p-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-braces me-2" style="color:var(--gf-primary)"></i>Monitor Configuration</h5>
    <div class="rounded p-4" style="background:#1a1528;font-family:'Courier New',monospace;font-size:.85rem;line-height:1.9">
        <div><span style="color:#546e7a">// Monitor with exponential backoff + missed slot catchup</span></div>
        <div><span style="color:#c792ea">const</span> <span style="color:var(--gf-accent)">missed</span> = <span style="color:#c792ea">await</span> <span style="color:#82aaff">connection</span>.<span style="color:#82aaff">getSignaturesForAddress</span>(</div>
        <div style="padding-left:1.5rem"><span style="color:var(--gf-accent)">LOAN_PROGRAM_ID</span>,</div>
        <div style="padding-left:1.5rem">{ <span style="color:#f78c6c">minContextSlot</span>: <span style="color:var(--gf-accent)">lastProcessedSlot</span>, <span style="color:#f78c6c">limit</span>: <span style="color:#f78c6c">100</span> }</div>
        <div>)</div>
        <div style="margin-top:.75rem"><span style="color:#546e7a">// Exponential backoff on disconnect</span></div>
        <div><span style="color:var(--gf-accent)">retryDelayMs</span> = <span style="color:#82aaff">Math</span>.<span style="color:#82aaff">min</span>(<span style="color:var(--gf-accent)">retryDelayMs</span> * <span style="color:#f78c6c">2</span>, <span style="color:#f78c6c">30_000</span>) <span style="color:#546e7a">// cap 30s</span></div>
    </div>
</div>
@endsection

@push('scripts')
<script>
(function() {
    var COLORS = {
        LoanRepaid: '#2ecc71',
        LoanDefaulted: '#e74c3c',
        CustodyConfirmed: '#3498db',
        DisburseCompleted: '#6c3ce0',
        MarkOverdue: '#f39c12',
        VaultDeposit: '#00bcd4'
    };

    function render(events) {
        var feed = document.getElementById('events-feed');
        if (!events || events.length === 0) {
            feed.innerHTML = '<div class="text-center text-muted py-4">No events recorded yet. The subscriber will start populating once the reader cron runs.</div>';
            return;
        }
        feed.innerHTML = events.map(function(e) {
            var color = COLORS[e.event_name] || '#6c757d';
            var sig = e.signature ? (e.signature.slice(0,6) + '...' + e.signature.slice(-4)) : '—';
            var url = e.explorer_url || '#';
            var desc = '';
            if (e.payload && typeof e.payload === 'object') {
                if (e.payload.amount) desc += e.payload.amount + ' ';
                if (e.payload.symbol) desc += e.payload.symbol + ' ';
                if (e.payload.note) desc += e.payload.note;
            }
            return '<div class="d-flex align-items-center py-3 border-bottom">' +
                '<span class="text-muted me-3" style="font-family:\'Courier New\',monospace;font-size:.8rem;min-width:80px">' + (e.time || '') + '</span>' +
                '<span class="badge rounded-pill px-2 py-1 me-3" style="background:' + color + ';min-width:145px;font-size:.78rem">' + e.event_name + '</span>' +
                '<a href="' + url + '" target="_blank" rel="noopener" class="me-3 text-decoration-none" style="font-size:.78rem;color:#6c757d;min-width:85px">' + sig + '</a>' +
                '<span class="small">' + desc + '</span>' +
                '</div>';
        }).join('');
    }

    async function load() {
        try {
            var res = await fetch('/api/onchain/events?limit=30', { headers: { 'Accept': 'application/json' } });
            var data = await res.json();
            render(data.events);
            document.getElementById('last-slot').textContent = data.last_slot ? data.last_slot.toLocaleString('en-US') : '—';
            document.getElementById('events-today').textContent = (data.events || []).filter(function(e) {
                return e.occurred_at && new Date(e.occurred_at).toDateString() === new Date().toDateString();
            }).length;
            document.getElementById('ws-status').className = 'badge bg-success px-2 py-1';
        } catch(e) {
            document.getElementById('ws-status').className = 'badge bg-danger px-2 py-1';
            document.getElementById('ws-status').textContent = 'Connection error';
        }
    }
    load();
    setInterval(load, 20_000);
})();
</script>
@endpush
