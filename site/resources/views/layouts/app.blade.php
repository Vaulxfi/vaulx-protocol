<!DOCTYPE html>
<html lang="en" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/png" href="{{ asset('favicon.png') }}">
    <link rel="shortcut icon" type="image/png" href="{{ asset('favicon.png') }}">
    <title>@yield('title', 'Vaulx') — Luxury Asset Collateral on Solana</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
    @stack('styles')
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-vx sticky-top">
        <div class="container-fluid px-4">
            <a class="navbar-brand" href="{{ route('home') }}">
                vaul<span>x</span>
            </a>
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-label="Toggle menu">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
                    @guest
                        <li class="nav-item"><a class="nav-link" href="{{ route('home') }}#how">How it works</a></li>
                        <li class="nav-item"><a class="nav-link" href="{{ route('home') }}#collateral">Collateral</a></li>
                        <li class="nav-item"><a class="nav-link" href="{{ route('simulator') }}">Simulator</a></li>
                        <li class="nav-item"><a class="nav-link" href="{{ route('team') }}">Team</a></li>
                        <li class="nav-item"><a class="nav-link" href="{{ route('faq') }}">Protocol</a></li>
                    @else
                        <li class="nav-item"><a class="nav-link" href="{{ route('simulator') }}">Simulator</a></li>
                        <li class="nav-item"><a class="nav-link" href="{{ route('team') }}">Team</a></li>
                        <li class="nav-item"><a class="nav-link" href="{{ route('faq') }}">Protocol</a></li>
                    @endguest

                    <li class="nav-item ms-lg-2">
                        <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
                            <i class="bi bi-moon-stars"></i>
                        </button>
                    </li>

                    @auth
                        <li class="nav-item ms-2" id="wallet-container">
                            <button class="btn btn-outline-light btn-sm px-3" id="btn-connect-wallet" onclick="GFWallet.connect()">
                                <i class="bi bi-wallet2 me-1"></i>Connect
                            </button>
                            <div class="wallet-info d-none" id="wallet-connected" onclick="GFWallet.toggleDropdown(event)">
                                <i class="bi bi-wallet2"></i>
                                <span class="wallet-address" id="wallet-display-addr"></span>
                                <span class="wallet-bal" id="wallet-sol-bal"></span>
                                <span class="wallet-bal" id="wallet-usdc-bal"></span>
                                <i class="bi bi-chevron-down" style="font-size:.6rem"></i>
                                <div class="wallet-dropdown" id="wallet-dropdown">
                                    <div class="dd-item" style="font-size:.7rem;cursor:default;font-family:'JetBrains Mono',monospace" id="wallet-full-addr"></div>
                                    <div class="dd-sep"></div>
                                    <button class="dd-item" onclick="GFWallet.copyAddress()"><i class="bi bi-clipboard me-2"></i>Copy address</button>
                                    <a class="dd-item text-decoration-none" href="{{ route('profile.show') }}"><i class="bi bi-person-circle me-2"></i>My profile</a>
                                    <button class="dd-item" onclick="GFWallet.disconnect()" style="color:#E57971"><i class="bi bi-plug me-2"></i>Disconnect</button>
                                </div>
                            </div>
                        </li>
                    @endauth

                    @guest
                        <li class="nav-item ms-2"><a class="nav-link" href="{{ route('login') }}">Sign In</a></li>
                        <li class="nav-item ms-lg-2"><a class="btn btn-gf btn-sm" href="{{ route('register') }}">Launch App</a></li>
                    @else
                        @php
                            $u = auth()->user();
                            $homeRoute = $u->isAdmin()
                                ? route('admin.dashboard')
                                : ($u->isEvaluator()
                                    ? route('evaluator.dashboard')
                                    : route('borrower.dashboard'));
                        @endphp
                        <li class="nav-item ms-lg-2">
                            <a class="btn btn-gf btn-sm" href="{{ $homeRoute }}">
                                <i class="bi bi-grid-fill me-1"></i>Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="{{ route('profile.show') }}" style="font-size:.78rem">
                                {{ auth()->user()->name }}
                            </a>
                        </li>
                        <li class="nav-item">
                            <form method="POST" action="{{ route('logout') }}" class="d-inline">
                                @csrf
                                <button type="submit" class="btn nav-link border-0 bg-transparent" aria-label="Logout">
                                    <i class="bi bi-box-arrow-right"></i>
                                </button>
                            </form>
                        </li>
                    @endguest
                </ul>
            </div>
        </div>
    </nav>

    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show m-3 rounded-3" role="alert">
            <i class="bi bi-check-circle me-1"></i> {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    @if(session('error'))
        <div class="alert alert-danger alert-dismissible fade show m-3 rounded-3" role="alert">
            <i class="bi bi-exclamation-triangle me-1"></i> {{ session('error') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    @yield('content')

    <footer class="text-center py-5 small">
        <div class="container">
            <div class="mb-3" style="font-family:'Playfair Display', serif;font-size:1.4rem;color:var(--vx-text)">
                vaul<span style="color:var(--vx-accent-mark)">x</span>
            </div>
            <div class="text-muted mb-3" style="font-size:0.8rem;letter-spacing:0.06em">
                Luxury Asset Collateral Protocol — Solana · RWA · DeFi
            </div>
            <div style="font-size:0.78rem;letter-spacing:0.06em;text-transform:uppercase">
                <a href="{{ route('terms') }}" class="text-muted text-decoration-none me-3">Terms</a>
                <a href="{{ route('faq') }}" class="text-muted text-decoration-none me-3">Protocol</a>
                <a href="{{ route('team') }}" class="text-muted text-decoration-none me-3">Team</a>
                <a href="{{ route('simulator') }}" class="text-muted text-decoration-none">Simulator</a>
            </div>
            <div class="mt-3 d-flex justify-content-center gap-3" style="font-size:1.1rem">
                <a href="https://github.com/Vaulxfi" target="_blank" rel="noopener" class="text-muted text-decoration-none" aria-label="Vaulx on GitHub"><i class="bi bi-github"></i></a>
                <a href="https://x.com/vaulx_rwa" target="_blank" rel="noopener" class="text-muted text-decoration-none" aria-label="Vaulx on X"><i class="bi bi-twitter-x"></i></a>
                <a href="https://t.me/vaulx_rwa" target="_blank" rel="noopener" class="text-muted text-decoration-none" aria-label="Vaulx on Telegram"><i class="bi bi-telegram"></i></a>
                <a href="mailto:hello@vaulx.fi" class="text-muted text-decoration-none" aria-label="Email Vaulx"><i class="bi bi-envelope"></i></a>
            </div>
            <div class="mt-3" style="font-size:0.7rem;color:var(--vx-text-subtle);letter-spacing:0.04em">
                © {{ date('Y') }} Vaulx. Built for private wealth.
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        window.GF_CONFIG = {
            rpcUrl: @json(config('garantifi.rpc_url')),
            usdcMint: @json(config('garantifi.tokens.USDC.mint')),
            brzMint: @json(config('garantifi.tokens.BRZ.mint')),
            fallbackUsdBrl: {{ (float) (config('garantifi.rates.fallback_brl_usd') ?: 5.18) }},
            network: @json(config('garantifi.network'))
        };
    </script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    {{--
        CSRF rescue: when nginx fastcgi_cache caches /login or /register HTML,
        the rendered _token field belongs to a stale session and every submit
        becomes 419. This script fetches /csrf-fresh (no-store) on page load
        and rewrites every <input name="_token"> + <meta name="csrf-token">
        with the current session's value, before the user submits.

        Cheap and safe: a) only runs when at least one _token field exists,
        b) silently no-ops if the fetch fails (server returns the original
        Laravel 419 in that case, identical to today's behaviour).
    --}}
    <script>
        (function () {
            var fields = document.querySelectorAll('input[name="_token"]');
            if (!fields.length) return;
            var url = '{{ route('csrf.fresh') }}';

            function fetchToken() {
                return fetch(url + '?_=' + Date.now(), { credentials: 'same-origin', cache: 'no-store' })
                    .then(function (r) { return r.ok ? r.text() : null; })
                    .then(function (token) {
                        if (!token) return null;
                        fields.forEach(function (el) { el.value = token; });
                        var meta = document.querySelector('meta[name="csrf-token"]');
                        if (meta) meta.setAttribute('content', token);
                        return token;
                    })
                    .catch(function () { return null; });
            }

            // 1. Refresh on page load.
            var primed = fetchToken();

            // 2. If the user submits before the page-load fetch resolved,
            //    pause submit, wait for fresh token, then continue.
            //
            // GOTCHA: programmatic `form.submit()` does NOT include the
            // clicked submit button's name/value. So a form with multiple
            // submit buttons that branch on `name="decision"` would lose
            // that field, validation would fail server-side, and the user
            // sees a silent re-render with no obvious clue. Capture the
            // event's `submitter` and stash a hidden field so the re-fired
            // submit carries the same payload as the native one would.
            document.querySelectorAll('form').forEach(function (form) {
                if (!form.querySelector('input[name="_token"]')) return;
                form.addEventListener('submit', function (e) {
                    if (form.dataset.vxTokenRefreshed === '1') return;
                    e.preventDefault();
                    var submitter = e.submitter;
                    if (submitter && submitter.name && submitter.value !== undefined) {
                        var dup = form.querySelector(
                            'input[type="hidden"][name="' + submitter.name + '"][data-vx-submitter="1"]'
                        );
                        if (!dup) {
                            var inp = document.createElement('input');
                            inp.type = 'hidden';
                            inp.name = submitter.name;
                            inp.value = submitter.value;
                            inp.dataset.vxSubmitter = '1';
                            form.appendChild(inp);
                        }
                    }
                    primed.then(function () {
                        form.dataset.vxTokenRefreshed = '1';
                        form.submit();
                    });
                });
            });
        })();
    </script>

    @stack('scripts')
</body>
</html>
