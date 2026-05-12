@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Cron Bot — mark_overdue')
@section('page-subtitle')
    Runs hourly, scans loans where <code>due_timestamp &lt; now()</code>
    <span class="badge bg-info ms-1">{{ strtoupper(config('garantifi.network')) }}</span>
@endsection
@section('page-actions')
    <span class="badge bg-success px-2 py-1" id="cron-status-badge">
        <span style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;animation:pulse-dot 2s infinite;vertical-align:middle" class="me-1"></span>
        Running
    </span>
@endsection

@section('panel-content')
<div class="row g-3 mb-4">
    <div class="col-md-4">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">Frequency</small>
            <h4 class="fw-bold mb-1">1h</h4>
            <small class="text-muted"><i class="bi bi-clock me-1"></i>Laravel schedule</small>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">Last run</small>
            <h4 class="fw-bold mb-1" id="last-run">—</h4>
            <small class="text-muted"><i class="bi bi-calendar-check me-1"></i><span id="runs-today-label">—</span></small>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card p-3 h-100">
            <small class="text-muted d-block">Total marked overdue</small>
            <h4 class="fw-bold mb-1" id="total-affected">—</h4>
            <small class="text-muted"><i class="bi bi-archive me-1"></i>All-time</small>
        </div>
    </div>
</div>

<div class="rounded p-4 mb-4 d-flex align-items-start" style="background:rgba(243,156,18,.1);border:1px solid rgba(243,156,18,.3)">
    <i class="bi bi-exclamation-triangle-fill me-3 flex-shrink-0" style="color:#f39c12;font-size:1.5rem;margin-top:2px"></i>
    <div>
        <h6 class="fw-bold mb-1" style="color:#f39c12">Bot Security</h6>
        <p class="mb-0" style="color:#8a6d3b">
            The bot wallet (<code>mark_overdue</code>) has <strong>ZERO access to the vault</strong>.
            It can only call <code>mark_overdue</code>. If the server is compromised,
            no funds can be moved.
        </p>
    </div>
</div>

<div class="card p-4 mb-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-braces me-2" style="color:var(--gf-primary)"></i>Cron logic (simplified)</h5>
    <div class="rounded p-4" style="background:#1a1528;font-family:'Courier New',monospace;font-size:.85rem;line-height:1.9">
        <div><span style="color:#546e7a">// php artisan garantifi:mark-overdue</span></div>
        <div><span style="color:#c792ea">$loans</span> = <span style="color:var(--gf-accent)">Loan</span>::<span style="color:#82aaff">where</span>(<span style="color:#c3e88d">'status'</span>, <span style="color:#c3e88d">'active'</span>)</div>
        <div style="padding-left:1.5rem">-><span style="color:#82aaff">whereDate</span>(<span style="color:#c3e88d">'due_date'</span>, <span style="color:#c3e88d">'&lt;'</span>, <span style="color:#82aaff">today</span>())->get();</div>
        <div style="margin-top:.75rem"><span style="color:#c792ea">foreach</span> (<span style="color:#f78c6c">$loans</span> <span style="color:#c792ea">as</span> <span style="color:#f78c6c">$loan</span>) {</div>
        <div style="padding-left:1.5rem"><span style="color:#f78c6c">$loan</span>->update([<span style="color:#c3e88d">'status'</span> => <span style="color:#c3e88d">'overdue'</span>]);</div>
        <div style="padding-left:1.5rem"><span style="color:#82aaff">OnchainEvent</span>::<span style="color:#82aaff">create</span>([<span style="color:#c3e88d">'event_name'</span> => <span style="color:#c3e88d">'MarkOverdue'</span>, ...]);</div>
        <div style="padding-left:1.5rem"><span style="color:#82aaff">notifyBorrower</span>(<span style="color:#f78c6c">$loan</span>->user); <span style="color:#546e7a">// push + email</span></div>
        <div>}</div>
    </div>
</div>

<div class="card p-4 mb-4">
    <h5 class="fw-bold mb-3"><i class="bi bi-clock-history me-2" style="color:var(--gf-primary)"></i>Run history</h5>
    <div class="table-responsive">
        <table class="table table-sm align-middle mb-0">
            <thead><tr><th>Time</th><th>Job</th><th>Scanned</th><th>Affected</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody id="runs-body">
                @for($i = 0; $i < 5; $i++)
                <tr>
                    <td><div class="skeleton skeleton-line sm"></div></td>
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
    <h5 class="fw-bold mb-3"><i class="bi bi-wallet2 me-2" style="color:var(--gf-primary)"></i>Bot Wallet</h5>
    <div class="d-flex align-items-center p-3 rounded" style="background:#f8f9fc;border:1px solid #e9ecef">
        <div style="width:44px;height:44px;border-radius:10px;background:#2c3e50;display:flex;align-items:center;justify-content:center" class="me-3 flex-shrink-0">
            <i class="bi bi-robot text-white"></i>
        </div>
        <div class="flex-grow-1">
            <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                <code style="font-size:.9rem;color:var(--gf-primary)">BotW...x9Qr</code>
                <span class="badge bg-secondary px-2 py-1">mark_overdue only</span>
                <span class="badge bg-danger px-2 py-1">ZERO vault access</span>
            </div>
            <small class="text-muted"><i class="bi bi-coin me-1"></i>Balance: 0.05 SOL (for transaction fees)</small>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
(function() {
    function render(data) {
        var body = document.getElementById('runs-body');
        if (!data.runs || data.runs.length === 0) {
            body.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No runs recorded yet. The cron will run automatically.</td></tr>';
        } else {
            body.innerHTML = data.runs.map(function(r) {
                var sClass = r.status === 'ok' ? 'bg-success' : (r.affected > 0 ? 'bg-warning text-dark' : 'bg-danger');
                return '<tr>' +
                    '<td class="text-muted">' + r.time + '</td>' +
                    '<td><code>' + r.name + '</code></td>' +
                    '<td>' + r.scanned + '</td>' +
                    '<td>' + r.affected + '</td>' +
                    '<td><span class="badge ' + sClass + ' px-2">' + (r.affected > 0 ? r.affected + ' marked' : 'OK') + '</span></td>' +
                    '<td class="text-muted small">' + (r.notes || '—') + '</td>' +
                    '</tr>';
            }).join('');
        }

        document.getElementById('last-run').textContent = data.summary.last_run_at
            ? new Date(data.summary.last_run_at).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})
            : '—';
        document.getElementById('runs-today-label').textContent = (data.summary.total_runs_today || 0) + ' runs today';
        document.getElementById('total-affected').textContent = data.summary.total_affected || 0;
    }

    async function load() {
        try {
            var res = await fetch('/api/onchain/cron-runs?limit=20', { headers: { 'Accept': 'application/json' } });
            var data = await res.json();
            render(data);
        } catch(e) {
            document.getElementById('cron-status-badge').className = 'badge bg-danger px-2 py-1';
        }
    }
    load();
    setInterval(load, 30_000);
})();
</script>
@endpush
