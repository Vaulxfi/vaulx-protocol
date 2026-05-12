{{-- Onboarding modal: shown on first dashboard visit when no assets exist --}}
@if(auth()->check() && !auth()->user()->isAdmin() && $assets->isEmpty() && $loans->isEmpty())
<div class="modal fade" id="onboardingModal" tabindex="-1" aria-labelledby="onboardingModalLabel" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header" style="background:var(--vx-bg);border-bottom:1px solid var(--vx-border)">
                <h5 class="modal-title" id="onboardingModalLabel" style="font-family:'Playfair Display', serif">
                    Welcome to <span style="color:var(--vx-gold)">Vaulx</span>
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Skip"></button>
            </div>

            <div class="modal-body p-4">
                <div class="d-flex mb-4 justify-content-center gap-2" id="onboarding-steps-indicator">
                    <div class="ob-dot active" data-step="1"></div>
                    <div class="ob-dot" data-step="2"></div>
                    <div class="ob-dot" data-step="3"></div>
                </div>

                <div class="ob-step active" data-step="1">
                    <div class="text-center mb-4">
                        <div style="width:80px;height:80px;border-radius:50%;background:rgba(201,168,76,0.1);border:1px solid var(--vx-gold);display:flex;align-items:center;justify-content:center;margin:0 auto">
                            <i class="bi bi-wallet2" style="font-size:2rem;color:var(--vx-gold)"></i>
                        </div>
                    </div>
                    <h4 class="vx-display text-center">Connect your wallet</h4>
                    <p class="text-muted text-center">
                        Connect Phantom, Backpack or Ledger to sign transactions and interact with the protocol.
                    </p>
                    <div class="text-center mt-4">
                        <button type="button" class="btn btn-gf-accent" id="ob-connect-wallet">
                            <i class="bi bi-wallet2 me-1"></i>Connect wallet
                        </button>
                        <div class="small text-muted mt-2">
                            <button type="button" class="btn btn-link btn-sm p-0 ob-next">Skip for now</button>
                        </div>
                    </div>
                </div>

                <div class="ob-step" data-step="2" style="display:none">
                    <div class="text-center mb-4">
                        <div style="width:80px;height:80px;border-radius:50%;background:rgba(201,168,76,0.1);border:1px solid var(--vx-gold);display:flex;align-items:center;justify-content:center;margin:0 auto">
                            <i class="bi bi-person-badge" style="font-size:2rem;color:var(--vx-gold)"></i>
                        </div>
                    </div>
                    <h4 class="vx-display text-center">Tax ID (optional)</h4>
                    <p class="text-muted text-center">
                        Add your CPF/CNPJ to speed up KYC on larger loans. You can skip and add it later.
                    </p>
                    <div class="mb-3">
                        <input type="text" class="form-control" id="ob-tax-id" placeholder="000.000.000-00" maxlength="18">
                    </div>
                    <div class="d-flex gap-2 justify-content-between">
                        <button type="button" class="btn btn-outline-secondary ob-prev"><i class="bi bi-arrow-left me-1"></i>Back</button>
                        <button type="button" class="btn btn-gf ob-next">Continue <i class="bi bi-arrow-right ms-1"></i></button>
                    </div>
                </div>

                <div class="ob-step" data-step="3" style="display:none">
                    <div class="text-center mb-4">
                        <div style="width:80px;height:80px;border-radius:50%;background:rgba(201,168,76,0.1);border:1px solid var(--vx-gold);display:flex;align-items:center;justify-content:center;margin:0 auto">
                            <i class="bi bi-box-seam" style="font-size:2rem;color:var(--vx-gold)"></i>
                        </div>
                    </div>
                    <h4 class="vx-display text-center">Register your first asset</h4>
                    <p class="text-muted text-center">
                        Submit a luxury watch, jewelry, art piece or classic vehicle. We appraise within 24h and unlock credit.
                    </p>
                    <div class="text-center mt-4">
                        <a href="{{ route('borrower.asset.create') }}" class="btn btn-gf-accent">
                            <i class="bi bi-plus-lg me-1"></i>Register an asset
                        </a>
                        <div class="small text-muted mt-2">
                            <button type="button" class="btn btn-link btn-sm p-0" data-bs-dismiss="modal">Explore dashboard first</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('styles')
<style>
.ob-dot { width:10px;height:10px;border-radius:50%;background:var(--vx-border);transition:background-color .2s; }
.ob-dot.active { background:var(--vx-gold); }
.ob-dot.done { background:var(--vx-champagne); }
</style>
@endpush

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    var shown = localStorage.getItem('vx_onboarding_shown_' + @json(auth()->id()));
    if (!shown) {
        new bootstrap.Modal(document.getElementById('onboardingModal')).show();
        localStorage.setItem('vx_onboarding_shown_' + @json(auth()->id()), '1');
    }

    function goTo(step) {
        document.querySelectorAll('.ob-step').forEach(function(el) {
            el.style.display = parseInt(el.dataset.step) === step ? 'block' : 'none';
        });
        document.querySelectorAll('.ob-dot').forEach(function(el) {
            var s = parseInt(el.dataset.step);
            el.classList.remove('active','done');
            if (s < step) el.classList.add('done');
            else if (s === step) el.classList.add('active');
        });
    }
    var current = 1;
    document.querySelectorAll('.ob-next').forEach(function(b) { b.addEventListener('click', function() { if (current < 3) { current++; goTo(current); } }); });
    document.querySelectorAll('.ob-prev').forEach(function(b) { b.addEventListener('click', function() { if (current > 1) { current--; goTo(current); } }); });

    document.getElementById('ob-connect-wallet').addEventListener('click', async function() {
        this.disabled = true;
        try { await GFWallet.connect(); } catch(e) {}
        this.disabled = false;
        current = 2; goTo(2);
    });
});
</script>
@endpush
@endif
