@extends('layouts.app')
@section('title', 'Create Account')

@section('content')
<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card p-4">
                <h4 class="fw-bold mb-1 text-center"><i class="bi bi-shield-lock-fill me-1" style="color:var(--gf-primary)"></i>Vaulx</h4>
                <p class="text-center text-muted mb-4">Create your borrower account</p>

                <form method="POST" action="{{ route('register') }}">
                    @csrf
                    <div class="mb-3">
                        <label class="form-label fw-semibold" for="name">Full name <span class="text-danger" aria-hidden="true">*</span></label>
                        <input type="text" name="name" id="name" class="form-control @error('name') is-invalid @enderror"
                               value="{{ old('name') }}" required>
                        @error('name')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold" for="email">Email <span class="text-danger" aria-hidden="true">*</span></label>
                        <input type="email" name="email" id="email" class="form-control @error('email') is-invalid @enderror"
                               value="{{ old('email') }}" required>
                        @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold" for="cpf_cnpj">Tax ID <small class="text-muted fw-normal">(optional)</small></label>
                            <input type="text" name="cpf_cnpj" id="cpf_cnpj" class="form-control" value="{{ old('cpf_cnpj') }}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold" for="phone">Phone <small class="text-muted fw-normal">(optional)</small></label>
                            <input type="text" name="phone" id="phone" class="form-control" value="{{ old('phone') }}">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold" for="password">Password <span class="text-danger" aria-hidden="true">*</span></label>
                        <input type="password" name="password" id="password" class="form-control @error('password') is-invalid @enderror" minlength="8" required>
                        @error('password')<div class="invalid-feedback">{{ $message }}</div>@enderror
                        <small class="text-muted">Minimum 8 characters.</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold" for="password_confirmation">Confirm password <span class="text-danger" aria-hidden="true">*</span></label>
                        <input type="password" name="password_confirmation" id="password_confirmation" class="form-control" minlength="8" required>
                    </div>
                    <div class="form-check mb-3">
                        <input type="checkbox" class="form-check-input" id="terms" name="terms" required>
                        <label class="form-check-label small" for="terms">
                            I agree with the <a href="{{ route('terms') }}" target="_blank">Terms of Use</a>.
                        </label>
                    </div>
                    <button type="submit" class="btn btn-gf w-100 py-2">Create Account</button>
                </form>
                <p class="text-center mt-3 mb-0 small">
                    Already have an account? <a href="{{ route('login') }}" style="color:var(--gf-primary)">Sign in</a>
                </p>
            </div>
        </div>
    </div>
</div>
@endsection
