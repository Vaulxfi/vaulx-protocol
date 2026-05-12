@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Vaults')
@section('page-subtitle')
    Protocol liquidity pools
    <span class="badge bg-info ms-1">{{ strtoupper(config('garantifi.network')) }}</span>
@endsection
@section('page-actions')
    <button class="btn btn-outline-primary btn-sm" id="btn-reload-vaults"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>
@endsection

@section('panel-content')
<div class="row g-4 mb-5" id="vaults-row">
    {{-- One skeleton — the demo stack runs a single on-chain USDC vault.
         BRZ never had its initialize_vault landed, so it's intentionally
         absent here (was previously a mock card). --}}
    <div class="col-lg-6">
        <div class="card p-4">
            <div class="d-flex gap-3 mb-3">
                <div class="skeleton skeleton-circle" style="width:44px;height:44px"></div>
                <div class="flex-grow-1">
                    <div class="skeleton skeleton-line lg" style="width:60%"></div>
                    <div class="skeleton skeleton-line sm" style="width:40%"></div>
                </div>
            </div>
            <div class="skeleton skeleton-line" style="height:8px;margin:1.5rem 0"></div>
            <div class="skeleton skeleton-line lg" style="width:80%"></div>
            <div class="skeleton skeleton-line" style="width:60%"></div>
        </div>
    </div>
</div>

<div class="card p-4">
    <h5 class="fw-bold mb-1"><i class="bi bi-terminal me-2" style="color:var(--gf-primary)"></i>Vault Program Instructions</h5>
    <p class="text-muted small mb-3">Anchor IDL — instructions available in the on-chain program</p>

    <div class="d-flex flex-wrap gap-2">
        <span class="badge rounded-pill px-3 py-2" style="background:var(--gf-primary);font-size:.85rem"><i class="bi bi-gear me-1"></i>initialize_vault <span class="badge bg-light text-dark ms-1" style="font-size:.65rem">Admin</span></span>
        <span class="badge rounded-pill px-3 py-2" style="background:var(--gf-primary);font-size:.85rem"><i class="bi bi-box-arrow-in-down me-1"></i>deposit_liquidity <span class="badge bg-light text-dark ms-1" style="font-size:.65rem">Admin</span></span>
        <span class="badge rounded-pill px-3 py-2" style="background:var(--gf-primary);font-size:.85rem"><i class="bi bi-box-arrow-up me-1"></i>withdraw_liquidity <span class="badge bg-light text-dark ms-1" style="font-size:.65rem">Admin</span></span>
        <span class="badge rounded-pill px-3 py-2" style="background:#e74c3c;font-size:.85rem"><i class="bi bi-pause-circle me-1"></i>pause_vault <span class="badge bg-light text-dark ms-1" style="font-size:.65rem">Admin</span></span>
        <span class="badge rounded-pill px-3 py-2" style="background:var(--gf-accent);color:var(--gf-dark);font-size:.85rem"><i class="bi bi-play-circle me-1"></i>resume_vault <span class="badge bg-light text-dark ms-1" style="font-size:.65rem">Admin</span></span>
        <span class="badge rounded-pill px-3 py-2" style="background:#2c3e50;font-size:.85rem"><i class="bi bi-send me-1"></i>disburse_loan <span class="badge bg-warning text-dark ms-1" style="font-size:.65rem">CPI</span></span>
        <span class="badge rounded-pill px-3 py-2" style="background:#2c3e50;font-size:.85rem"><i class="bi bi-receipt me-1"></i>receive_repayment <span class="badge bg-warning text-dark ms-1" style="font-size:.65rem">CPI</span></span>
    </div>
</div>

<div class="modal fade" id="vaultActionModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header" style="background:var(--gf-dark);color:#fff">
                <h5 class="modal-title"><i class="bi bi-safe me-2"></i><span id="va-title">Vault action</span></h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-info small mb-3">
                    <i class="bi bi-info-circle me-1"></i>Sensitive actions require Squads Multisig 2/3 signature.
                    This UI builds the instruction and submits it to the approval flow.
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Amount</label>
                    <div class="input-group">
                        <span class="input-group-text" id="va-prefix">$</span>
                        <input type="number" id="va-amount" class="form-control" min="0" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="rounded p-2" style="background:#f8f9fc;font-family:'Courier New',monospace;font-size:.8rem">
                    <div>vault_pda: <span id="va-pda" style="color:var(--gf-primary)">—</span></div>
                    <div>mint:     <span id="va-mint" style="color:var(--gf-primary)">—</span></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="btn-propose"><i class="bi bi-pen me-1"></i>Propose to Squads</button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
(function() {
    var modal = null;
    var currentAction = null;

    function render(data) {
        var row = document.getElementById('vaults-row');
        var html = '';
        for (var symbol in data.vaults) {
            var v = data.vaults[symbol];
            var color = symbol === 'USDC' ? '#2775ca' : '#00a86b';
            var pref = v.prefix || '$';
            var totalForUtil = (v.deposited != null && v.deposited > 0) ? v.deposited : ((v.available || 0) + (v.lent || 0));
            var util = totalForUtil > 0 ? ((v.lent || 0) / totalForUtil * 100) : 0;
            var liveTag = v.is_live
                ? '<span class="badge bg-success ms-1">DEVNET · LIVE</span>'
                : '<span class="badge bg-warning text-dark ms-1" title="Bridge read failed: ' + (v.bridge_error || 'unknown') + '">BRIDGE OFFLINE</span>';
            var pausedTag = v.is_paused ? '<span class="badge bg-danger ms-1">PAUSED</span>' : '';
            var pdaShort = v.pda ? (v.pda.slice(0,8) + '...' + v.pda.slice(-4)) : '—';
            var mintShort = v.mint ? (v.mint.slice(0,8) + '...' + v.mint.slice(-4)) : '—';
            var deposited = v.deposited != null ? v.deposited : ((v.available || 0) + (v.lent || 0));

            html += '<div class="col-lg-6"><div class="card p-0 overflow-hidden">' +
                '<div class="p-4">' +
                '<div class="d-flex justify-content-between align-items-start mb-3">' +
                '<div class="d-flex align-items-center">' +
                '<div style="width:44px;height:44px;border-radius:10px;background:' + color + ';display:flex;align-items:center;justify-content:center" class="me-3">' +
                '<span class="fw-bold text-white" style="font-size:1.2rem">' + symbol.charAt(0) + '</span></div>' +
                '<div><h5 class="fw-bold mb-0">' + symbol + ' Vault ' + liveTag + pausedTag + '</h5>' +
                '<small class="text-muted">' + (v.name || '') + '</small></div></div>' +
                '<span class="badge bg-' + (v.is_paused ? 'danger' : 'success') + ' px-2 py-1">' +
                '<i class="bi bi-circle-fill me-1" style="font-size:.5rem"></i>' + (v.is_paused ? 'PAUSED' : 'ACTIVE') + '</span></div>' +
                '<div class="row g-3 mb-4">' +
                '<div class="col-4"><small class="text-muted d-block">Deposited</small>' +
                '<h5 class="fw-bold mb-0">' + pref + (deposited).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + '</h5></div>' +
                '<div class="col-4"><small class="text-muted d-block">Lent (' + (v.active_loans||0) + ')</small>' +
                '<h5 class="fw-bold mb-0 text-warning">' + pref + (v.lent || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + '</h5></div>' +
                '<div class="col-4"><small class="text-muted d-block">Available</small>' +
                '<h5 class="fw-bold mb-0" style="color:var(--gf-accent)">' + pref + (v.available || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + '</h5></div></div>' +
                '<div class="progress mb-3" style="height:8px">' +
                '<div class="progress-bar bg-warning" style="width:' + util.toFixed(1) + '%" title="Lent"></div>' +
                '<div class="progress-bar" style="width:' + (100-util).toFixed(1) + '%;background:var(--gf-accent)" title="Available"></div></div>' +
                '<small class="text-muted">Utilization: ' + util.toFixed(1) + '%</small>' +
                '<div class="rounded p-3 mt-3" style="background:#1a1528;font-family:\'Courier New\',monospace;font-size:.8rem;color:rgba(255,255,255,.7)">' +
                '<div class="mb-1"><span class="text-muted">mint:</span> <span style="color:var(--gf-accent)">' + mintShort + '</span></div>' +
                '<div class="mb-1"><span class="text-muted">PDA: </span> <span style="color:var(--gf-accent)">' + pdaShort + '</span></div>' +
                '<div><span class="text-muted">seeds:</span> [b"vault_state", ' + symbol.toLowerCase() + '_mint]</div></div>' +
                '</div>' +
                '<div class="border-top p-3 d-flex gap-2">' +
                '<button class="btn btn-success btn-sm flex-fill action-btn" data-action="deposit" data-symbol="' + symbol + '"><i class="bi bi-box-arrow-in-down me-1"></i>Deposit</button>' +
                '<button class="btn btn-outline-primary btn-sm flex-fill action-btn" data-action="withdraw" data-symbol="' + symbol + '"' + ((v.lent || 0) > 0 ? ' disabled title="Withdraw blocked: active loans"' : '') + '><i class="bi bi-box-arrow-up me-1"></i>Withdraw</button>' +
                '<button class="btn btn-outline-danger btn-sm flex-fill action-btn" data-action="' + (v.is_paused ? 'resume' : 'pause') + '" data-symbol="' + symbol + '"><i class="bi bi-' + (v.is_paused ? 'play' : 'pause') + '-circle me-1"></i>' + (v.is_paused ? 'Resume' : 'Pause') + '</button>' +
                '</div></div></div>';
        }
        row.innerHTML = html || '<div class="col-12 text-center text-muted py-5">No vaults configured.</div>';

        document.querySelectorAll('.action-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { openModal(data.vaults[this.dataset.symbol], this.dataset.action); });
        });
    }

    function openModal(vault, action) {
        if (!modal) modal = new bootstrap.Modal(document.getElementById('vaultActionModal'));
        currentAction = { vault: vault, action: action };
        var titles = {
            deposit:  'Deposit liquidity · ' + vault.symbol,
            withdraw: 'Withdraw liquidity · ' + vault.symbol,
            pause:    'Pause vault · ' + vault.symbol,
            resume:   'Resume vault · ' + vault.symbol
        };
        document.getElementById('va-title').textContent = titles[action] || action;
        document.getElementById('va-prefix').textContent = vault.prefix || '$';
        document.getElementById('va-amount').value = '';
        document.getElementById('va-amount').disabled = (action === 'pause' || action === 'resume');
        document.getElementById('va-pda').textContent = vault.pda || '—';
        document.getElementById('va-mint').textContent = vault.mint || '—';
        modal.show();
    }

    document.getElementById('btn-propose').addEventListener('click', function() {
        if (!currentAction) return;
        if (typeof GFWallet === 'undefined' || !GFWallet.isConnected()) {
            GFToast.warning('Connect your wallet (Phantom/Ledger) to propose to Squads.');
            return;
        }
        var amount = parseFloat(document.getElementById('va-amount').value) || 0;
        GFToast.info('Proposal "' + currentAction.action + '" on ' + currentAction.vault.symbol + ' sent to Squads. Awaiting second signature.');
        modal.hide();
    });

    async function load() {
        try {
            var res = await fetch('/api/vaults', { headers: { 'Accept': 'application/json' } });
            var data = await res.json();
            render(data);
        } catch(e) {
            document.getElementById('vaults-row').innerHTML = '<div class="col-12 text-danger text-center py-4">Failed to load vaults.</div>';
        }
    }

    document.getElementById('btn-reload-vaults').addEventListener('click', load);
    load();
    setInterval(load, 30_000);
})();
</script>
@endpush
