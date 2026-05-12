@extends('layouts.app')
@section('title', 'FAQ')

@section('content')
<div class="container py-5" style="max-width:860px">
    <p class="pitch-line mb-2">Protocol</p>
    <h2 class="vx-display mb-3">Frequently Asked Questions</h2>
    <p class="text-muted">Clear answers about how Vaulx works.</p>

    <div class="accordion" id="faqAccordion">
        @foreach([
            ['How does collateralized lending work?', 'You register a physical asset (watch, jewelry, art, vehicle), ship it to audited custody, and after the protocol creates the on-chain loan record you can borrow USDC up to the allowed LTV (capped at 60%).'],
            ['Can I receive in reais (BRZ) or only in dollars (USDC)?', 'Both. In step 2 of the wizard you choose. BRZ is BRL-backed and removes FX risk; USDC has deeper liquidity. Repayment must be in the same currency as the disbursement.'],
            ['How is interest calculated?', 'Linear simple interest: Principal × (annual_bps / 10,000) × (elapsed_seconds / 31,536,000). Example: R$5,000 at 24% APR for 90 days = R$ 295.89.'],
            ['What happens if I miss a payment?', '1.5% monthly late fee on the principal. After maturity the loan automatically becomes OVERDUE via the cron bot. Continued delinquency leads to admin-executed liquidation.'],
            ['Can I see my loan on Solana?', 'Yes — every active loan has a TRDC state PDA on-chain (program: Loan). You can verify the principal, due date, status, and the disbursement transaction on Solana Explorer. The PDA is owned by the Loan Program, so it cannot be reassigned or tampered with off-chain.'],
            ['What is the Squads 2/3 Multisig?', 'All sensitive actions (deposit, withdraw, pause, default) require 2 of 3 signatures from the team: Founder, Co-founder and a cold-storage Backup. No single key controls funds.'],
            ['Can the mark_overdue bot touch my vault?', 'No. The cron bot wallet has ZERO vault access — it can only call the mark_overdue instruction. A compromised server cannot move funds.'],
            ['How is BRZ depeg monitored?', 'Every 5 minutes the backend queries Jupiter Price API (BRZ/USD) + AwesomeAPI (USD/BRL). >1% deviation alerts the admin; >3% pauses the BRZ vault; >5% triggers a conversion offer to USDC.'],
            ['Can I withdraw the liquidity I deposited?', 'Vault deposits are made by the admin (protocol treasury). Withdrawals are only allowed when there are no active loans in the vault, to guarantee solvency.'],
        ] as $i => $qa)
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button {{ $i > 0 ? 'collapsed' : '' }}" type="button" data-bs-toggle="collapse" data-bs-target="#faq-{{ $i }}">
                        {{ $qa[0] }}
                    </button>
                </h2>
                <div id="faq-{{ $i }}" class="accordion-collapse collapse {{ $i === 0 ? 'show' : '' }}" data-bs-parent="#faqAccordion">
                    <div class="accordion-body">{{ $qa[1] }}</div>
                </div>
            </div>
        @endforeach
    </div>

    <div class="text-center mt-5">
        <a href="{{ route('simulator') }}" class="btn btn-gf me-2"><i class="bi bi-calculator me-1"></i>Simulate loan</a>
        <a href="{{ route('register') }}" class="btn btn-gf-accent">Create account</a>
    </div>
</div>
@endsection
