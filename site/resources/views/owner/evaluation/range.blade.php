@extends('layouts.panel')
@section('sidebar') @include('borrower.sidebar') @endsection
@section('page-title', 'Evaluation range — ' . $asset->brand . ' ' . $asset->model)
@section('page-subtitle', 'The online evaluator has delivered a preliminary range.')

@section('panel-content')
<div class="row g-4">
    <div class="col-lg-7">
        <x-card title="Your preliminary range" icon="graph-up" accent="accent">
            <p class="text-muted small mb-3">
                Based on the online evaluator's report and current market data. The exact value is not revealed
                — it's decided in the physical step.
            </p>
            <div class="text-center py-3">
                <div style="font-family:'Playfair Display', serif;font-size:2.6rem;font-weight:600;color:var(--vx-gold)">
                    <x-money :amount="$evaluation->range_min" /> &mdash; <x-money :amount="$evaluation->range_max" />
                </div>
                <small class="text-muted">USDC · appraisal window</small>
            </div>

            <div class="alert alert-info small mb-0">
                <strong>You have 48h to decide.</strong> Advancing means you will deliver the watch to the offline
                evaluator for physical inspection. The final value is only established after both layers + market
                cross-check.
            </div>
        </x-card>
    </div>

    <div class="col-lg-5">
        <x-card title="Decide" icon="check-circle">
            <form method="POST" action="{{ route('evaluation.decide', $asset) }}">
                @csrf
                <p class="text-muted small">Pick one:</p>
                <button type="submit" name="decision" value="advance" class="btn btn-gf-accent w-100 mb-2">
                    <i class="bi bi-arrow-right-circle me-1"></i>Advance to physical inspection
                </button>
                <button type="submit" name="decision" value="abort" class="btn btn-outline-secondary w-100"
                        onclick="return confirm('End the evaluation process? This cannot be undone.');">
                    <i class="bi bi-x-circle me-1"></i>End evaluation
                </button>
            </form>
        </x-card>
    </div>
</div>
@endsection
