@extends('layouts.panel')
@section('sidebar') @include('borrower.sidebar') @endsection
@section('page-title', 'Loan ' . $loan->code)
@section('page-subtitle')
    <span class="badge bg-{{ $loan->status_color }}">{{ $loan->status_label }}</span>
    <span class="badge bg-light text-dark ms-1">{{ $loan->currency }}</span>
@endsection

@section('panel-content')
@if($loan->status === 'repaid' && \App\Models\Loan::reloanEligible($loan->asset))
    <div class="card card-accent accent p-4 mb-4">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h5 class="fw-bold mb-1"><i class="bi bi-lightning-fill me-2 text-amber"></i>Loan repaid · ready for a re-loan?</h5>
                <p class="text-muted mb-0">Your <strong>{{ $loan->asset->brand }} {{ $loan->asset->model }}</strong> is already appraised and tracked. Skip the wizard and the evaluator queue.</p>
            </div>
            <a href="{{ route('borrower.reloan.show', $loan->asset) }}" class="btn btn-gf-accent btn-lg">
                <i class="bi bi-arrow-clockwise me-1"></i>Re-loan one-click
            </a>
        </div>
    </div>
@endif

<div class="row g-4">
    <div class="col-lg-8">
        {{-- Loan details --}}
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3">Loan Details</h6>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <small class="text-muted d-block">Principal</small>
                    <h5 class="fw-bold">{{ $loan->formatAmount($loan->principal) }}</h5>
                </div>
                <div class="col-md-4 mb-3">
                    <small class="text-muted d-block">Outstanding balance</small>
                    <h5 class="fw-bold text-danger">{{ $loan->formatAmount($loan->outstanding_balance) }}</h5>
                </div>
                <div class="col-md-4 mb-3">
                    <small class="text-muted d-block">Total paid</small>
                    <h5 class="fw-bold text-success">{{ $loan->formatAmount($loan->total_repaid) }}</h5>
                </div>
            </div>
            <div class="progress mb-3" style="height:10px">
                <div class="progress-bar bg-success" style="width:{{ $loan->progress_percent }}%"></div>
            </div>
            <div class="row">
                <div class="col-md-3 mb-2">
                    <small class="text-muted d-block">LTV</small>
                    <strong>{{ $loan->ltv_percent }}%</strong>
                </div>
                <div class="col-md-3 mb-2">
                    <small class="text-muted d-block">Interest rate</small>
                    <strong>{{ $loan->interest_rate }}% APR</strong>
                </div>
                <div class="col-md-3 mb-2">
                    <small class="text-muted d-block">Term</small>
                    <strong>{{ $loan->term_months }} months</strong>
                </div>
                <div class="col-md-3 mb-2">
                    <small class="text-muted d-block">Currency</small>
                    <strong>{{ $loan->currency }}</strong>
                </div>
                <div class="col-md-3 mb-2">
                    <small class="text-muted d-block">Origination fee</small>
                    <strong>{{ $loan->formatAmount($loan->origination_fee) }} ({{ $loan->origination_fee_percent }}%)</strong>
                </div>
                <div class="col-md-3 mb-2">
                    <small class="text-muted d-block">Asset value</small>
                    <strong>{{ $loan->formatAmount($loan->asset_value) }}</strong>
                </div>
                <div class="col-md-3 mb-2">
                    <small class="text-muted d-block">Start</small>
                    <strong>{{ $loan->start_date ? $loan->start_date->format(config('app.date_format')) : 'Pending' }}</strong>
                </div>
                <div class="col-md-3 mb-2">
                    <small class="text-muted d-block">Due</small>
                    <strong>{{ $loan->due_date ? $loan->due_date->format(config('app.date_format')) : 'Pending' }}</strong>
                </div>
            </div>
        </div>

        {{-- Payments --}}
        <div class="card p-4">
            <h6 class="fw-bold mb-3">Installments</h6>
            @if($loan->payments->isEmpty())
                <p class="text-muted text-center py-3">Installments will be generated after loan activation.</p>
            @else
                <div class="table-responsive">
                    <table class="table table-sm align-middle">
                        <thead><tr><th>#</th><th>Due</th><th>Amount</th><th>Paid</th><th>Status</th><th>TX</th><th></th></tr></thead>
                        <tbody>
                        @foreach($loan->payments as $payment)
                            <tr class="{{ $payment->isOverdue() ? 'table-danger' : '' }}">
                                <td>{{ $payment->installment_number }}</td>
                                <td>{{ $payment->due_date->format(config('app.date_format')) }}</td>
                                <td>{{ $loan->formatAmount($payment->amount_due) }}</td>
                                <td>{{ $loan->formatAmount($payment->amount_paid) }}</td>
                                <td>
                                    <span class="badge bg-{{ $payment->status === 'paid' ? 'success' : ($payment->status === 'overdue' ? 'danger' : 'warning') }}">
                                        {{ $payment->status_label }}
                                    </span>
                                </td>
                                <td>
                                    @if($payment->tx_hash)
                                        <a href="{{ $loan->explorerUrl('tx', $payment->tx_hash) }}" target="_blank" rel="noopener" class="wallet-addr text-decoration-none">
                                            {{ Str::limit($payment->tx_hash, 8) }}… <i class="bi bi-box-arrow-up-right" style="font-size:.7rem"></i>
                                        </a>
                                    @else
                                        -
                                    @endif
                                </td>
                                <td>
                                    @if(in_array($payment->status, ['pending', 'overdue']) && in_array($loan->status, ['active', 'overdue']))
                                        <button type="button" class="btn btn-success btn-sm"
                                                data-bs-toggle="modal"
                                                data-bs-target="#payModal"
                                                data-payment-id="{{ $payment->id }}"
                                                data-installment="{{ $payment->installment_number }}"
                                                data-amount-raw="{{ $payment->amount_due }}"
                                                data-principal-raw="{{ $payment->principal_portion }}"
                                                data-interest-raw="{{ $payment->interest_portion }}"
                                                data-due="{{ $payment->due_date->format(config('app.date_format')) }}"
                                                data-action="{{ route('borrower.payment.pay', $payment) }}">
                                            <i class="bi bi-check-lg me-1"></i>Pay
                                        </button>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>

        {{-- Payment Modal --}}
        <div class="modal fade" id="payModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form method="POST" id="payForm">
                        @csrf
                        <div class="modal-header" style="background:var(--gf-dark);color:#fff">
                            <h5 class="modal-title"><i class="bi bi-cash-coin me-2"></i>Pay installment #<span id="modal-installment"></span></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-light border mb-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Due date</span>
                                    <strong id="modal-due"></strong>
                                </div>
                                <hr class="my-2">
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-muted">Principal</span>
                                    <span id="modal-principal"></span>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-muted">Interest</span>
                                    <span id="modal-interest"></span>
                                </div>
                                <hr class="my-2">
                                <div class="d-flex justify-content-between">
                                    <strong>Installment total</strong>
                                    <strong style="color:var(--gf-primary);font-size:1.1rem" id="modal-amount"></strong>
                                </div>
                            </div>

                            <div class="mb-3">
                                <button type="button" class="btn btn-outline-primary w-100 mb-2" id="btn-wallet-pay">
                                    <i class="bi bi-wallet2 me-1"></i>Pay via connected wallet
                                </button>
                                <small class="text-muted d-block text-center">— or enter manually —</small>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-semibold">
                                    <i class="bi bi-link-45deg me-1"></i>Solana transaction hash *
                                </label>
                                <input type="text" name="tx_hash" id="modal-tx-hash"
                                       class="form-control font-monospace @error('tx_hash') is-invalid @enderror"
                                       placeholder="Paste the TX hash after sending payment from your wallet"
                                       required minlength="10" maxlength="88">
                                <div class="form-text">
                                    Send the amount in {{ $loan->currency }} to the escrow and paste the hash here.
                                </div>
                                @error('tx_hash')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-success" id="btn-confirm-pay">
                                <i class="bi bi-check-circle me-1"></i>Confirm payment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="col-lg-4">
        {{-- Asset summary --}}
        <div class="card p-4 mb-4">
            <h6 class="fw-bold mb-3"><i class="bi bi-box-seam me-1"></i>Collateral</h6>
            <strong>{{ $loan->asset->brand }} {{ $loan->asset->model }}</strong>
            <small class="text-muted d-block">{{ $loan->asset->category_label }}</small>
            <hr>
            <small class="text-muted d-block">Custody</small>
            <span class="badge bg-{{ $loan->asset->custody_status_color }}">{{ $loan->asset->custody_status_label }}</span>
            <hr>
            <a href="{{ route('borrower.asset.show', $loan->asset) }}" class="btn btn-sm btn-outline-secondary w-100">View Asset</a>
        </div>

        {{-- Solana info --}}
        <x-solana-panel :loan="$loan" />

        @if($loan->approver)
        <div class="card p-4 mt-4">
            <h6 class="fw-bold mb-2">Approved by</h6>
            <p class="mb-0">{{ $loan->approver->name }}<br><small class="text-muted">{{ $loan->approved_at ? $loan->approved_at->format('m/d/Y H:i') : '' }}</small></p>
        </div>
        @endif
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    var LOAN_CURRENCY = @json($loan->currency);
    var payModal = document.getElementById('payModal');
    if (!payModal) return;

    payModal.addEventListener('show.bs.modal', function(event) {
        var btn = event.relatedTarget;
        document.getElementById('payForm').action = btn.dataset.action;
        document.getElementById('modal-installment').textContent = btn.dataset.installment;
        document.getElementById('modal-amount').textContent = GFCurrency.format(parseFloat(btn.dataset.amountRaw), LOAN_CURRENCY);
        document.getElementById('modal-principal').textContent = GFCurrency.format(parseFloat(btn.dataset.principalRaw), LOAN_CURRENCY);
        document.getElementById('modal-interest').textContent = GFCurrency.format(parseFloat(btn.dataset.interestRaw), LOAN_CURRENCY);
        document.getElementById('modal-due').textContent = btn.dataset.due;
        document.getElementById('modal-tx-hash').value = '';
    });

    document.getElementById('btn-wallet-pay').addEventListener('click', async function() {
        if (typeof GFWallet === 'undefined' || !GFWallet.isConnected()) {
            GFToast.warning('Connect your wallet first to pay automatically.');
            return;
        }
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Waiting for signature...';
        try {
            var result = await GFWallet.signPayment({
                loanCode: @json($loan->code),
                escrow: @json($loan->escrow_address),
                amount: parseFloat(document.querySelector('[data-bs-dismiss="modal"]').previousElementSibling?.dataset?.amountRaw || 0),
                currency: LOAN_CURRENCY
            });
            if (result && result.txHash) {
                document.getElementById('modal-tx-hash').value = result.txHash;
                GFToast.success('Transaction signed. Confirm to record the payment.');
            }
        } catch(e) {
            console.warn(e);
            GFToast.danger('Signing failed: ' + (e.message || 'rejected'));
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="bi bi-wallet2 me-1"></i>Pay via connected wallet';
        }
    });

    document.getElementById('payForm').addEventListener('submit', function() {
        var btn = document.getElementById('btn-confirm-pay');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Confirming...';
    });
});
</script>
@endpush
