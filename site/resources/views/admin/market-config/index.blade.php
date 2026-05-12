@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Market config — BRL correction factors')
@section('page-subtitle', 'Per-brand / per-family multiplier applied to imported USD market medians.')

@section('panel-content')
<div class="row g-4">
    <div class="col-lg-5">
        <x-card title="Add or update" icon="plus-circle">
            <form method="POST" action="{{ route('admin.market-config.store') }}">
                @csrf
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="brand">Brand <span class="text-danger">*</span></label>
                    <input type="text" name="brand" id="brand" class="form-control" placeholder="Rolex" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="family">Family (optional)</label>
                    <input type="text" name="family" id="family" class="form-control" placeholder="Submariner — leave empty for all families">
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="brl_factor">BRL factor <span class="text-danger">*</span></label>
                    <input type="number" step="0.01" min="0.1" max="5" name="brl_factor" id="brl_factor" class="form-control" value="1.00" required>
                    <small class="text-muted">Multiplier on the imported USD median. 1.00 = no adjustment.</small>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold" for="notes">Notes</label>
                    <input type="text" name="notes" id="notes" class="form-control">
                </div>
                <button type="submit" class="btn btn-gf w-100">Save factor</button>
            </form>
        </x-card>
    </div>

    <div class="col-lg-7">
        <x-card title="Existing factors" icon="list">
            @if($configs->isEmpty())
                <x-empty-state icon="inbox" title="No factors configured" description="Add one on the left to override the default 1.00." />
            @else
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead><tr><th>Brand</th><th>Family</th><th>Factor</th><th>Notes</th><th></th></tr></thead>
                        <tbody>
                        @foreach($configs as $cfg)
                            <tr>
                                <td><strong>{{ $cfg->brand }}</strong></td>
                                <td>{{ $cfg->family ?: 'all' }}</td>
                                <td><code>{{ number_format((float) $cfg->brl_factor, 4) }}</code></td>
                                <td class="small text-muted">{{ $cfg->notes }}</td>
                                <td>
                                    <form method="POST" action="{{ route('admin.market-config.delete', $cfg) }}">
                                        @csrf
                                        <button type="submit" class="btn btn-outline-danger btn-sm" onclick="return confirm('Delete?');">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
                {{ $configs->links() }}
            @endif
        </x-card>
    </div>
</div>
@endsection
