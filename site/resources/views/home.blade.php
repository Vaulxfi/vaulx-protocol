@extends('layouts.app')
@section('title', 'Vaulx')

@section('content')

{{-- HERO --}}
<section class="hero">
    <div class="container text-center">
        <div class="pitch-line mb-4" style="display:inline-block;padding:0.4rem 1.1rem;border:1px solid var(--vx-border-soft);border-radius:999px">
            <span style="color:var(--vx-accent-mark)">●</span>
            <span class="ms-2">Solana · RWA · DeFi Protocol</span>
        </div>
        <h1 class="mb-4">
            Your Assets.<br>
            Your <em>Liquidity</em>.
        </h1>
        <p class="lead mb-5 mx-auto">
            Unlock instant USDC loans against luxury watches, jewelry, and high-value physical assets — on-chain, collateral-backed, no credit score.
        </p>
        <div class="d-flex gap-3 justify-content-center flex-wrap">
            <a href="{{ route('register') }}" class="btn btn-gf-accent btn-lg px-4">Launch App</a>
            <a href="{{ route('simulator') }}" class="btn btn-outline-light btn-lg px-4">View Simulator</a>
        </div>
    </div>
</section>

{{-- ANCHOR TRUST BAND --}}
<section class="py-5" style="background:var(--vx-bg);border-bottom:1px solid var(--vx-border)">
    <div class="container">
        <div class="row g-4 text-center">
            <div class="col-6 col-md-3">
                <div class="pitch-number">$3T+</div>
                <p class="text-muted small mt-2" style="letter-spacing:0.04em">Global luxury asset market</p>
            </div>
            <div class="col-6 col-md-3">
                <div class="pitch-number accent">95%</div>
                <p class="text-muted small mt-2" style="letter-spacing:0.04em">Of these assets are illiquid</p>
            </div>
            <div class="col-6 col-md-3">
                <div class="pitch-number">40–65%</div>
                <p class="text-muted small mt-2" style="letter-spacing:0.04em">Conservative LTV</p>
            </div>
            <div class="col-6 col-md-3">
                <div class="pitch-number accent">24h</div>
                <p class="text-muted small mt-2" style="letter-spacing:0.04em">From appraisal to liquidity</p>
            </div>
        </div>
    </div>
</section>

{{-- LIVE ON-CHAIN STATS — devnet snapshot, refreshed server-side every 60s. Hidden when both reads are offline so the public landing degrades to its static narrative. --}}
@if (isset($onchain) && (($onchain['loan_config']['ok'] ?? false) || ($onchain['vault']['ok'] ?? false)))
<section class="py-5" style="background:var(--vx-bg);border-bottom:1px solid var(--vx-border)">
    <div class="container">
        <div class="text-center mb-4">
            <span class="pitch-line" style="display:inline-block;padding:0.4rem 1.1rem;border:1px solid var(--vx-border-soft);border-radius:999px">
                <span style="color:var(--vx-accent-mark)">●</span>
                <span class="ms-2 text-muted small">live · devnet · refreshed {{ $onchain['fetched_at'] }}</span>
            </span>
        </div>
        <div class="row g-4 text-center">
            @if ($onchain['vault']['ok'] ?? false)
                @php $v = $onchain['vault']['data']['fields'] ?? []; @endphp
                <div class="col-6 col-md-3">
                    <div class="pitch-number">{{ number_format(($v['total_assets'] ?? 0) / 1_000_000, 0) }}</div>
                    <p class="text-muted small mt-2" style="letter-spacing:0.04em">USDC in vault</p>
                </div>
                <div class="col-6 col-md-3">
                    <div class="pitch-number accent">{{ number_format($onchain['vault']['data']['slot'] ?? 0) }}</div>
                    <p class="text-muted small mt-2" style="letter-spacing:0.04em">Solana slot</p>
                </div>
            @endif
            @if ($onchain['loan_config']['ok'] ?? false)
                @php $cfg = $onchain['loan_config']['data']['fields'] ?? []; @endphp
                <div class="col-6 col-md-3">
                    <div class="pitch-number">{{ ($cfg['kyc_required'] ?? false) ? 'ON' : 'OFF' }}</div>
                    <p class="text-muted small mt-2" style="letter-spacing:0.04em">KYC gate</p>
                </div>
                <div class="col-6 col-md-3">
                    @php
                        $oracle = $cfg['oracle_admin'] ?? '';
                        $oracleOn = $oracle && $oracle !== '11111111111111111111111111111111';
                    @endphp
                    <div class="pitch-number accent">{{ $oracleOn ? 'ON' : 'OFF' }}</div>
                    <p class="text-muted small mt-2" style="letter-spacing:0.04em">RedStone oracle</p>
                </div>
            @endif
        </div>
    </div>
</section>
@endif

{{-- HOW IT WORKS --}}
<section class="py-5" id="how" style="background:var(--vx-bg)">
    <div class="container py-4">
        <div class="text-center mb-5">
            <p class="pitch-line mb-2">The Protocol</p>
            <h2 class="vx-display">How it works</h2>
            <p class="text-muted" style="max-width:38rem;margin:1rem auto 0">
                Four steps from asset to on-chain liquidity. Zero credit bureaus. Zero paperwork.
            </p>
        </div>
        <div class="row g-4">
            <div class="col-md-3">
                <div class="text-center">
                    <div class="step-icon"><i class="bi bi-camera"></i></div>
                    <h5 class="fw-bold">1. Register</h5>
                    <p class="text-muted small">Submit your asset with photos, description and estimated value.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <div class="step-icon"><i class="bi bi-shield-check"></i></div>
                    <h5 class="fw-bold">2. Custody</h5>
                    <p class="text-muted small">Ship to our insured, audited vault in São Paulo — fully climate-controlled.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <div class="step-icon"><i class="bi bi-gem"></i></div>
                    <h5 class="fw-bold">3. Tokenize</h5>
                    <p class="text-muted small">An on-chain credit record (TRDC state PDA) is created on Solana, representing your loan against the collateral.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="text-center">
                    <div class="step-icon"><i class="bi bi-currency-bitcoin"></i></div>
                    <h5 class="fw-bold">4. Receive</h5>
                    <p class="text-muted small">USDC or BRZ wired to your wallet — on-chain, instant, trustless.</p>
                </div>
            </div>
        </div>
    </div>
</section>

{{-- COLLATERAL TYPES --}}
<section class="py-5" id="collateral" style="background:var(--vx-surface)">
    <div class="container py-4">
        <div class="text-center mb-5">
            <p class="pitch-line mb-2">Accepted Collateral</p>
            <h2 class="vx-display">A curated universe</h2>
            <p class="text-muted" style="max-width:38rem;margin:1rem auto 0">
                We accept only assets with liquid secondary markets and verifiable provenance.
            </p>
        </div>
        <div class="row g-4">
            <div class="col-md-3 col-6">
                <div class="asset-type-card">
                    <i class="bi bi-watch d-block mb-3"></i>
                    <h6 class="fw-bold">Luxury Watches</h6>
                    <small class="text-muted">Rolex · Patek Philippe · AP · Omega</small>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="asset-type-card">
                    <i class="bi bi-gem d-block mb-3"></i>
                    <h6 class="fw-bold">Fine Jewelry</h6>
                    <small class="text-muted">Diamonds · Emeralds · Gold · Platinum</small>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="asset-type-card">
                    <i class="bi bi-palette d-block mb-3"></i>
                    <h6 class="fw-bold">Fine Art</h6>
                    <small class="text-muted">Paintings · Sculptures · Photography</small>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="asset-type-card">
                    <i class="bi bi-car-front d-block mb-3"></i>
                    <h6 class="fw-bold">Classic Cars</h6>
                    <small class="text-muted">Classics · Supercars · Collectibles</small>
                </div>
            </div>
        </div>
    </div>
</section>

{{-- PROTOCOL ECONOMICS --}}
<section class="py-5" id="lend" style="background:var(--vx-bg)">
    <div class="container py-4">
        <div class="text-center mb-5">
            <p class="pitch-line mb-2">Protocol Economics</p>
            <h2 class="vx-display">Aligned incentives</h2>
            <p class="text-muted" style="max-width:38rem;margin:1rem auto 0">
                Transparent, on-chain, conservatively underwritten.
            </p>
        </div>
        <div class="row g-4 justify-content-center">
            <div class="col-md-3">
                <div class="card text-center p-4 h-100">
                    <div class="pitch-number">2–3%</div>
                    <h6 class="fw-bold mt-3" style="letter-spacing:0.04em">ORIGINATION</h6>
                    <small class="text-muted">Charged on disbursement — no hidden fees.</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center p-4 h-100">
                    <div class="pitch-number accent">8–12%</div>
                    <h6 class="fw-bold mt-3" style="letter-spacing:0.04em">NET MARGIN</h6>
                    <small class="text-muted">Annual interest spread over funding cost.</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center p-4 h-100">
                    <div class="pitch-number">24% APR</div>
                    <h6 class="fw-bold mt-3" style="letter-spacing:0.04em">SIMPLE LINEAR</h6>
                    <small class="text-muted">BACEN-aligned; no compound surprises.</small>
                </div>
            </div>
        </div>
    </div>
</section>

{{-- EXAMPLE TX --}}
<section class="py-5" style="background:var(--vx-surface)">
    <div class="container py-4">
        <div class="row align-items-center g-5">
            <div class="col-md-6">
                <p class="pitch-line mb-2">A Live Example</p>
                <h2 class="vx-display">One Submariner.<br>Eight Thousand.</h2>
                <p class="text-muted mt-3" style="font-size:1.05rem;line-height:1.7">
                    A Rolex Submariner with independent appraisal at <strong class="text-gold">$15,000</strong>
                    unlocks <strong class="text-gold">$8,250 USDC</strong> at 55% LTV in under 24 hours.
                    On-chain. Non-custodial after disbursement. Return the loan, reclaim the watch.
                </p>
                <div class="d-flex gap-3 mt-4">
                    <a href="{{ route('simulator') }}" class="btn btn-gf btn-lg">Run the Simulator</a>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card p-4" style="border:1px solid var(--vx-border-soft)">
                    <div class="d-flex align-items-center mb-3">
                        <i class="bi bi-watch text-gold" style="font-size:1.8rem"></i>
                        <div class="ms-3">
                            <h5 class="fw-bold mb-0">Rolex Submariner</h5>
                            <small class="text-muted">Ref. 126610LN · 2022</small>
                        </div>
                    </div>
                    <hr>
                    <div class="row text-center g-3">
                        <div class="col-4">
                            <small class="text-muted d-block" style="letter-spacing:0.04em">VALUE</small>
                            <strong style="font-size:1.25rem">$15,000</strong>
                        </div>
                        <div class="col-4">
                            <small class="text-muted d-block" style="letter-spacing:0.04em">LTV</small>
                            <strong class="text-gold" style="font-size:1.25rem">55%</strong>
                        </div>
                        <div class="col-4">
                            <small class="text-muted d-block" style="letter-spacing:0.04em">CREDIT</small>
                            <strong class="text-champagne" style="font-size:1.25rem">$8,250</strong>
                        </div>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between small">
                        <span class="text-muted">NFT Mint</span>
                        <span class="wallet-addr">7xKXt…demo</span>
                    </div>
                    <div class="d-flex justify-content-between small mt-1">
                        <span class="text-muted">Escrow PDA</span>
                        <span class="wallet-addr">9pQrL…demo</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

{{-- FINAL CTA --}}
<section class="cta-section text-center">
    <div class="container">
        <p class="pitch-line mb-2">Private Wealth · Public Chain</p>
        <h2 class="vx-display mb-3">Luxury pawn, reimagined.</h2>
        <p class="text-muted mb-4" style="max-width:34rem;margin:0 auto 2rem">
            Join the private beta. Create an account in under two minutes.
        </p>
        <div class="d-flex gap-3 justify-content-center flex-wrap">
            <a href="{{ route('simulator') }}" class="btn btn-outline-light btn-lg px-4">Try Simulator</a>
            <a href="{{ route('register') }}" class="btn btn-gf-accent btn-lg px-4">Launch App</a>
        </div>
    </div>
</section>
@endsection
