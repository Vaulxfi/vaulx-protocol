@php
    $u = auth()->user();
    $isOnline = $u->isEvaluatorOnline();
    $isOffline = $u->isEvaluatorOffline();
    $label = $u->isAdmin() ? 'ADMIN · BOTH LAYERS'
        : ($isOnline && $isOffline ? 'EVALUATOR · BOTH'
        : ($isOnline ? 'EVALUATOR · ONLINE' : 'EVALUATOR · OFFLINE'));
@endphp

<ul class="nav flex-column">
    <li class="nav-item">
        <small class="text-muted px-3 d-block" style="font-size:.68rem;letter-spacing:0.12em;text-transform:uppercase">{{ $label }}</small>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('evaluator.dashboard') ? 'active' : '' }}" href="{{ route('evaluator.dashboard') }}">
            <i class="bi bi-clipboard-data me-2"></i>My queue
        </a>
    </li>

    <li class="nav-item mt-3">
        <small class="text-muted px-3 d-block" style="font-size:.68rem;letter-spacing:0.12em;text-transform:uppercase">Account</small>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('profile.*') ? 'active' : '' }}" href="{{ route('profile.show') }}">
            <i class="bi bi-person-circle me-2"></i>My Profile
        </a>
    </li>
</ul>
