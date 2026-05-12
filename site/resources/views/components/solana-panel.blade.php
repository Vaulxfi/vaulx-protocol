@props(['loan'])

{{-- On-chain panel for the loan detail page.

     Shows the fields that are actually anchored on devnet: the loan PDA
     and (when present) the confirm_custody transaction signature. Legacy
     mock fields (escrow_address, disbursement_tx_hash, repayment_tx_hash,
     asset.nft_mint_address) were Str::random() placeholders from before
     the bridge wiring — surfacing them in the demo would link to
     non-existent accounts on Solana Explorer, which would be embarrassing
     in front of the judges. They're hidden until real on-chain data
     populates them. --}}
<div class="card p-4">
    <div class="d-flex justify-content-between align-items-start mb-3">
        <h6 class="fw-bold mb-0">
            <i class="bi bi-link-45deg me-1"></i>Solana
        </h6>
        <span class="badge bg-success" title="Live on Solana devnet">
            {{ strtoupper(config('garantifi.network')) }} · LIVE
        </span>
    </div>

    @if($loan->getRawOriginal('solana_loan_id'))
        <small class="text-muted d-block">Loan ID (on-chain)</small>
        <div class="mb-2">
            <x-explorer type="address" :value="$loan->solana_loan_id" :length="20" />
        </div>
    @endif

    @if($loan->confirm_custody_tx)
        <small class="text-muted d-block">Custody confirmation TX</small>
        <div class="mb-0">
            <x-explorer type="tx" :value="$loan->confirm_custody_tx" :length="20" />
        </div>
    @endif

    @if(!$loan->getRawOriginal('solana_loan_id') && !$loan->confirm_custody_tx)
        <p class="text-muted small mb-0">
            On-chain state will appear after the borrower's loan is confirmed by the custodian.
        </p>
    @endif
</div>
