@extends('layouts.app')
@section('title', 'Reset Password')

@section('content')
<div class="container py-5" style="max-width:460px">
    <div class="card p-4">
        <div class="text-center mb-3">
            <i class="bi bi-key-fill" style="font-size:2rem;color:var(--gf-primary)"></i>
            <h3 class="fw-bold mt-2">Reset password</h3>
            <p class="text-muted small mb-0">Choose a new password for your account.</p>
        </div>

        <form method="POST" action="{{ route('password.update') }}">
            @csrf
            <input type="hidden" name="token" value="{{ $token }}">
            <div class="mb-3">
                <label class="form-label fw-semibold" for="email">Email <span class="text-danger">*</span></label>
                <input type="email" name="email" id="email"
                       class="form-control @error('email') is-invalid @enderror"
                       value="{{ old('email', $email) }}" required>
                @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold" for="password">New password <span class="text-danger">*</span></label>
                <input type="password" name="password" id="password"
                       class="form-control @error('password') is-invalid @enderror"
                       minlength="8" required>
                @error('password')<div class="invalid-feedback">{{ $message }}</div>@enderror
                <small class="text-muted">Minimum 8 characters.</small>
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold" for="password_confirmation">Confirm new password <span class="text-danger">*</span></label>
                <input type="password" name="password_confirmation" id="password_confirmation"
                       class="form-control" minlength="8" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Reset password</button>
        </form>
    </div>
</div>
@endsection
