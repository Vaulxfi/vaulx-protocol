@extends('layouts.app')
@section('title', 'Forgot Password')

@section('content')
<div class="container py-5" style="max-width:460px">
    <div class="card p-4">
        <div class="text-center mb-3">
            <i class="bi bi-shield-lock-fill" style="font-size:2rem;color:var(--gf-primary)"></i>
            <h3 class="fw-bold mt-2">Forgot password</h3>
            <p class="text-muted small mb-0">Enter your email and we'll send a reset link.</p>
        </div>

        @if(session('success'))
            <div class="alert alert-success small">{{ session('success') }}</div>
        @endif

        <form method="POST" action="{{ route('password.email') }}">
            @csrf
            <div class="mb-3">
                <label class="form-label fw-semibold" for="email">Email <span class="text-danger">*</span></label>
                <input type="email" name="email" id="email"
                       class="form-control @error('email') is-invalid @enderror"
                       value="{{ old('email') }}" required autofocus>
                @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <button type="submit" class="btn btn-primary w-100">Send reset link</button>
        </form>

        <div class="text-center mt-3 small">
            <a href="{{ route('login') }}" class="text-muted text-decoration-none">
                <i class="bi bi-arrow-left me-1"></i>Back to sign in
            </a>
        </div>
    </div>
</div>
@endsection
