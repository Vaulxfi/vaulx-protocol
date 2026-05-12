<ul class="nav flex-column">
    <li class="nav-item">
        <small class="text-muted px-3 d-block" style="font-size:.68rem;letter-spacing:0.12em;text-transform:uppercase">Overview</small>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}" href="{{ route('admin.dashboard') }}">
            <i class="bi bi-speedometer2 me-2"></i>Dashboard
        </a>
    </li>

    <li class="nav-item mt-3">
        <small class="text-muted px-3 d-block" style="font-size:.68rem;letter-spacing:0.12em;text-transform:uppercase">Operations</small>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.assets*') || request()->routeIs('admin.asset.*') ? 'active' : '' }}" href="{{ route('admin.assets.pending') }}">
            <i class="bi bi-clipboard-check me-2"></i>Evaluations
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.loans*') ? 'active' : '' }}" href="{{ route('admin.loans') }}">
            <i class="bi bi-cash-coin me-2"></i>Loans
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.users') ? 'active' : '' }}" href="{{ route('admin.users') }}">
            <i class="bi bi-people me-2"></i>Users
        </a>
    </li>

    <li class="nav-item mt-3">
        <small class="text-muted px-3 d-block" style="font-size:.68rem;letter-spacing:0.12em;text-transform:uppercase">Protocol</small>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.vaults') ? 'active' : '' }}" href="{{ route('admin.vaults') }}">
            <i class="bi bi-safe me-2"></i>Vaults
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.multisig') ? 'active' : '' }}" href="{{ route('admin.multisig') }}">
            <i class="bi bi-shield-lock me-2"></i>Multisig
        </a>
    </li>
    {{--
        BRZ Monitor (route admin.monitor-brz) intentionally hidden:
        BRZ vault was never deployed on-chain, so the page's "Response
        Policy by Tier" advertised pause_vault / conversion actions that
        no Anchor instruction backs. Route + view kept on disk for future
        re-enable; sidebar entry stays out so we don't surface a
        roadmap-only feature during the demo.
    --}}

    <li class="nav-item mt-3">
        <small class="text-muted px-3 d-block" style="font-size:.68rem;letter-spacing:0.12em;text-transform:uppercase">Evaluation</small>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.evaluators.*') ? 'active' : '' }}" href="{{ route('admin.evaluators.index') }}">
            <i class="bi bi-people-fill me-2"></i>Evaluators
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.market-config.*') ? 'active' : '' }}" href="{{ route('admin.market-config.index') }}">
            <i class="bi bi-graph-up-arrow me-2"></i>Market config
        </a>
    </li>

    <li class="nav-item mt-3">
        <small class="text-muted px-3 d-block" style="font-size:.68rem;letter-spacing:0.12em;text-transform:uppercase">Automation</small>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.cron-bot') ? 'active' : '' }}" href="{{ route('admin.cron-bot') }}">
            <i class="bi bi-robot me-2"></i>Cron Bot
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('admin.eventos-onchain') ? 'active' : '' }}" href="{{ route('admin.eventos-onchain') }}">
            <i class="bi bi-broadcast me-2"></i>On-chain Events
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

    <li class="nav-item mt-4">
        <small class="text-muted px-3 d-block" style="font-size:.68rem;letter-spacing:0.12em;text-transform:uppercase">Quick filters</small>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="{{ route('admin.loans', ['status' => 'pending_custody']) }}">
            <i class="bi bi-hourglass-split me-2"></i>Pending Custody
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="{{ route('admin.loans', ['status' => 'overdue']) }}">
            <i class="bi bi-exclamation-triangle me-2"></i>Overdue
        </a>
    </li>
</ul>

<div class="px-3 mt-auto pt-4" style="position:absolute;bottom:1.5rem;left:0;right:0">
    <div class="rounded px-2 py-2 d-flex align-items-center" style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.25);min-width:0">
        <span class="me-2 flex-shrink-0" style="width:8px;height:8px;border-radius:50%;background:var(--vx-gold);display:inline-block;animation:pulse-dot 2s infinite"></span>
        <small style="color:var(--vx-gold);font-weight:500;font-size:.65rem;letter-spacing:.03em;line-height:1.2;min-width:0;flex:1">Multisig 2/3 · active</small>
    </div>
</div>

<style>
@keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: .4; }
}
</style>
