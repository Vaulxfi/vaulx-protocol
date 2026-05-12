@extends('layouts.app')
@section('title', 'Terms of Use')

@section('content')
<div class="container py-5" style="max-width:860px">
    <h2 class="fw-bold mb-3">Terms of Use</h2>
    <p class="text-muted">Last updated: {{ now()->format('m/d/Y') }}</p>

    <h5 class="fw-bold mt-4">1. Overview</h5>
    <p>Vaulx is a luxury asset collateral protocol — "luxury pawn meets private bank" — operating on the Solana network. This document governs the use of the platform during the private beta.</p>

    <h5 class="fw-bold mt-4">2. Eligibility</h5>
    <p>Users must be at least 18 years old and own a compatible Solana wallet (Phantom, Backpack or Ledger). KYC information will be required for the production release.</p>

    <h5 class="fw-bold mt-4">3. Collateral custody</h5>
    <p>Physical assets must be shipped to the audited custody facility indicated by the protocol. The on-chain loan record (TRDC state PDA) is held by the Loan Program until the loan is fully repaid, at which point the physical asset is released back to the borrower.</p>

    <h5 class="fw-bold mt-4">4. Interest model</h5>
    <p>Linear simple interest, annual rate declared in basis points. 1.5% monthly late fee over the principal for delinquent loans. 2.5% origination fee is charged upon disbursement.</p>

    <h5 class="fw-bold mt-4">5. Multi-token</h5>
    <p>Disbursement can be made in USDC or BRZ. Repayment must be made in the same currency as the disbursement — there is no automatic on-chain conversion.</p>

    <h5 class="fw-bold mt-4">6. BRZ depeg risk</h5>
    <p>If the BRZ/BRL peg deviates by more than 3%, the BRZ vault is automatically paused. Deviations above 5% trigger an option to convert the outstanding balance to USDC at the adjusted rate.</p>

    <h5 class="fw-bold mt-4">7. Default</h5>
    <p>After maturity and the grace period, the admin may execute liquidation: the on-chain loan record is transitioned to Defaulted and the physical asset is auctioned or retained according to operational policy.</p>

    <h5 class="fw-bold mt-4">8. Limitation of liability</h5>
    <p>The platform is in private beta. The team is not liable for losses resulting from use prior to a formal independent audit of the on-chain programs and custody operations.</p>

    <p class="mt-4 text-muted small">Contact: support@vaulx.fi</p>
</div>
@endsection
