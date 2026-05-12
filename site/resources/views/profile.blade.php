@extends('layouts.panel')
@section('sidebar')
    @if(auth()->user()->isAdmin())
        @include('admin.sidebar')
    @else
        @include('borrower.sidebar')
    @endif
@endsection
@section('page-title', 'My Profile')
@section('page-subtitle', 'Personal data and linked Solana wallet')

@section('panel-content')
<div class="row g-4">
    <div class="col-lg-7">
        <div class="card p-4">
            <h5 class="fw-bold mb-3"><i class="bi bi-person-circle me-2" style="color:var(--gf-primary)"></i>Personal data</h5>
            <form method="POST" action="{{ route('profile.update') }}">
                @csrf
                <div class="mb-3">
                    <label class="form-label fw-semibold">Name</label>
                    <input type="text" class="form-control" name="name" value="{{ old('name', auth()->user()->name) }}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Email</label>
                    <input type="email" class="form-control" name="email" value="{{ old('email', auth()->user()->email) }}" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Phone</label>
                        <input type="text" class="form-control" name="phone" value="{{ old('phone', auth()->user()->phone) }}">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Tax ID (CPF / CNPJ)</label>
                        <input type="text" class="form-control" name="cpf_cnpj" value="{{ old('cpf_cnpj', auth()->user()->cpf_cnpj) }}">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Solana wallet address (Phantom / Ledger)</label>
                    <input type="text" class="form-control font-monospace" name="wallet_address" id="profile-wallet"
                           value="{{ old('wallet_address', auth()->user()->wallet_address) }}" placeholder="xxxx...xxxx">
                    <div class="form-text">
                        <button type="button" class="btn btn-link btn-sm p-0" id="btn-fill-wallet">
                            <i class="bi bi-wallet2 me-1"></i>Use the connected wallet
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg me-1"></i>Save changes</button>
            </form>
        </div>
    </div>

    <div class="col-lg-5">
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-2"><i class="bi bi-shield-lock me-1" style="color:var(--gf-primary)"></i>Security</h6>
            <p class="small text-muted mb-3">Your Solana wallet is used to sign transactions and interact with the protocol. Keep your seed phrase in a safe place.</p>
            <a href="https://phantom.app" target="_blank" rel="noopener" class="btn btn-outline-primary btn-sm w-100 mb-2"><i class="bi bi-download me-1"></i>Install Phantom</a>
        </div>

        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-2"><i class="bi bi-link-45deg me-1" style="color:var(--vx-gold)"></i>Sign-in with Solana</h6>
            @if(auth()->user()->solana_pubkey)
                <p class="small text-muted mb-2">This account is linked to Solana wallet:</p>
                <code class="d-block mb-3" style="font-size:.8rem;color:var(--vx-gold);word-break:break-all">{{ auth()->user()->solana_pubkey }}</code>
                <small class="text-muted">You can sign in with this wallet from the login page.</small>
            @else
                <p class="small text-muted mb-3">Link your Solana wallet to enable passwordless sign-in.</p>
                <button type="button" class="btn btn-gf-accent w-100" id="btn-link-siws">
                    <i class="bi bi-wallet2 me-1"></i>Link Solana wallet
                </button>
                <div id="siws-link-error" class="alert alert-danger small mt-2 d-none"></div>
            @endif
        </div>

        <div class="card p-4">
            <h6 class="fw-bold mb-2"><i class="bi bi-info-circle me-1" style="color:var(--vx-gold)"></i>Account</h6>
            <small class="text-muted d-block">Created</small>
            <strong class="d-block mb-2">{{ auth()->user()->created_at->format(config('app.datetime_format')) }}</strong>
            <small class="text-muted d-block">Role</small>
            <span class="badge bg-light text-dark">{{ ucfirst(auth()->user()->role ?? 'borrower') }}</span>
            <hr>
            <small class="text-muted d-block">Auth provider</small>
            <span class="badge bg-light text-dark">{{ ucfirst(auth()->user()->auth_provider ?? 'email') }}</span>
        </div>
    </div>
</div>

<form method="POST" action="{{ route('profile.link-solana') }}" id="siws-link-form" style="display:none">
    @csrf
    <input type="hidden" name="nonce" id="siws-link-nonce">
    <input type="hidden" name="pubkey" id="siws-link-pubkey">
    <input type="hidden" name="signature" id="siws-link-signature">
</form>
@endsection

@push('scripts')
<script>
document.getElementById('btn-fill-wallet').addEventListener('click', function() {
    if (typeof GFWallet === 'undefined' || !GFWallet.isConnected()) {
        GFToast.warning('Connect your wallet first.');
        return;
    }
    document.getElementById('profile-wallet').value = GFWallet.getAddress();
    GFToast.success('Address filled in.');
});

var btnLink = document.getElementById('btn-link-siws');
if (btnLink) {
    btnLink.addEventListener('click', async function() {
        var err = document.getElementById('siws-link-error');
        err.classList.add('d-none');
        btnLink.disabled = true;
        btnLink.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Waiting for wallet signature...';
        try {
            var provider = window.solana && window.solana.isPhantom ? window.solana : window.backpack;
            if (!provider) throw new Error('Solana wallet not detected.');
            if (!GFWallet.isConnected()) { await GFWallet.connect(); }

            var r = await fetch('/auth/siws/challenge', { headers: { Accept:'application/json' }, credentials:'same-origin' });
            var ch = await r.json();
            var encoded = new TextEncoder().encode(ch.message);
            var signed = await provider.signMessage(encoded, 'utf8');
            var sigBytes = signed.signature || signed;

            // inline base58 encode (reused approach)
            var ALPH = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
            var num = 0n;
            for (var b of sigBytes) num = (num << 8n) + BigInt(b);
            var s = '';
            while (num > 0n) { s = ALPH[Number(num % 58n)] + s; num = num / 58n; }

            document.getElementById('siws-link-nonce').value = ch.nonce;
            document.getElementById('siws-link-pubkey').value = GFWallet.getAddress();
            document.getElementById('siws-link-signature').value = s;
            document.getElementById('siws-link-form').submit();
        } catch(e) {
            err.textContent = e.message || 'Link failed';
            err.classList.remove('d-none');
            btnLink.disabled = false;
            btnLink.innerHTML = '<i class="bi bi-wallet2 me-1"></i>Link Solana wallet';
        }
    });
}
</script>
@endpush
