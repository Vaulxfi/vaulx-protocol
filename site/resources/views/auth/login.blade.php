@extends('layouts.app')
@section('title', 'Sign In')

@section('content')
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-5">
            <div class="card p-4">
                <h4 class="fw-bold mb-1 text-center"><i class="bi bi-shield-lock-fill me-1" style="color:var(--gf-primary)"></i>Vaulx</h4>
                <p class="text-center text-muted mb-4">Sign in to your account</p>

                @if(session('success'))
                    <div class="alert alert-success small">{{ session('success') }}</div>
                @endif

                <button type="button" class="btn btn-gf-accent w-100 mb-3" id="btn-siws">
                    <i class="bi bi-wallet2 me-2"></i>Sign in with Solana
                </button>
                <div class="text-center text-muted small mb-3" style="position:relative">
                    <span style="background:var(--vx-surface);padding:0 .75rem;position:relative;z-index:1">or</span>
                    <div style="position:absolute;top:50%;left:0;right:0;border-top:1px solid var(--vx-border);z-index:0"></div>
                </div>
                <div id="siws-error" class="alert alert-danger small d-none"></div>

                <form method="POST" action="{{ route('login') }}">
                    @csrf
                    <div class="mb-3">
                        <label class="form-label fw-semibold" for="email">Email <span class="text-danger" aria-hidden="true">*</span></label>
                        <input type="email" name="email" id="email" class="form-control @error('email') is-invalid @enderror"
                               value="{{ old('email') }}" required autofocus>
                        @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold d-flex justify-content-between" for="password">
                            <span>Password <span class="text-danger" aria-hidden="true">*</span></span>
                            <a href="{{ route('password.request') }}" class="text-muted small text-decoration-none">Forgot?</a>
                        </label>
                        <input type="password" name="password" id="password" class="form-control @error('password') is-invalid @enderror" required>
                        @error('password')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                    <div class="mb-3 form-check">
                        <input type="checkbox" name="remember" class="form-check-input" id="remember">
                        <label class="form-check-label" for="remember">Remember me</label>
                    </div>
                    <button type="submit" class="btn btn-gf w-100 py-2">Sign In</button>
                </form>
                <p class="text-center mt-3 mb-0 small">
                    Don't have an account yet? <a href="{{ route('register') }}" style="color:var(--vx-accent-mark)">Create account</a>
                </p>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.getElementById('btn-siws').addEventListener('click', async function() {
    var btn = this;
    var err = document.getElementById('siws-error');
    err.classList.add('d-none');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Waiting for wallet signature...';
    try {
        var result = await GFWallet.signInWithSolana();
        if (result && result.redirect) {
            btn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Signed in — redirecting...';
            window.location.href = result.redirect;
        }
    } catch (e) {
        err.textContent = e.message || 'Sign-in failed';
        err.classList.remove('d-none');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-wallet2 me-2"></i>Sign in with Solana';
    }
});
</script>
@endpush
