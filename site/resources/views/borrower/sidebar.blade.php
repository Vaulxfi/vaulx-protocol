<ul class="nav flex-column">
    <li class="nav-item">
        <small class="text-white-50 px-3 text-uppercase" style="font-size:.7rem">Borrower</small>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('borrower.dashboard') ? 'active' : '' }}" href="{{ route('borrower.dashboard') }}">
            <i class="bi bi-grid me-2"></i>Dashboard
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('borrower.asset.*') ? 'active' : '' }}" href="{{ route('borrower.dashboard') }}#assets">
            <i class="bi bi-box-seam me-2"></i>My Assets
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('borrower.loan.request') ? 'active' : '' }}" href="{{ route('borrower.loan.request') }}">
            <i class="bi bi-plus-circle me-2"></i>Request Loan
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('borrower.loans') ? 'active' : '' }}" href="{{ route('borrower.loans') }}">
            <i class="bi bi-cash-coin me-2"></i>My Loans
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="{{ route('simulator') }}">
            <i class="bi bi-calculator me-2"></i>Simulator
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link {{ request()->routeIs('profile.*') ? 'active' : '' }}" href="{{ route('profile.show') }}">
            <i class="bi bi-person-circle me-2"></i>My Profile
        </a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="{{ route('faq') }}">
            <i class="bi bi-question-circle me-2"></i>FAQ
        </a>
    </li>
</ul>
