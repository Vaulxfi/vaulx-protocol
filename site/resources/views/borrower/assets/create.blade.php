@extends('layouts.panel')
@section('sidebar') @include('borrower.sidebar') @endsection
@section('page-title', 'Register Asset')
@section('page-subtitle', 'Submit your asset details for evaluation')

@section('panel-content')
<div class="row justify-content-center">
    <div class="col-lg-7">
        <div class="card p-4">
            <form method="POST" action="{{ route('borrower.asset.store') }}" enctype="multipart/form-data" id="asset-form">
                @csrf
                @if(!empty($demoFill))
                    {{-- Demo autofill marker: storeAsset() reads this to slot
                         in a stub Rolex photo (file inputs can't be filled
                         programmatically from JS). --}}
                    <input type="hidden" name="_demo_fill" value="1">
                @endif

                <div class="mb-3">
                    <label class="form-label fw-semibold">Asset name *</label>
                    <div class="row">
                        <div class="col-md-6 mb-2">
                            <input type="text" name="brand" class="form-control" value="{{ old('brand') }}" placeholder="Brand (e.g., Rolex)" required data-demo-value="Rolex">
                        </div>
                        <div class="col-md-6 mb-2">
                            <input type="text" name="model" class="form-control" value="{{ old('model') }}" placeholder="Model (e.g., Submariner)" data-demo-value="Submariner Date 126610LN">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-semibold">Category *</label>
                        <select name="category" class="form-select @error('category') is-invalid @enderror" required data-demo-value="watch">
                            <option value="">Select...</option>
                            @foreach(\App\Models\Asset::CATEGORIES as $key => $label)
                                <option value="{{ $key }}" {{ old('category') == $key ? 'selected' : '' }}>{{ $label }}</option>
                            @endforeach
                        </select>
                        @error('category')<div class="invalid-feedback">{{ $message }}</div>@enderror
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-semibold">Reference # <small class="text-muted fw-normal">(pivot)</small></label>
                        <input type="text" name="reference_number" class="form-control" value="{{ old('reference_number') }}" placeholder="e.g. 126610LN" data-demo-value="126610LN">
                        <small class="text-muted">Used for automatic market lookup.</small>
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label fw-semibold">Serial number</label>
                        <input type="text" name="serial_number" class="form-control" value="{{ old('serial_number') }}" placeholder="Optional" data-demo-value="5N9C81H2">
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Condition *</label>
                        <select name="condition" class="form-select" required data-demo-value="excellent">
                            <option value="excellent" {{ old('condition','excellent') == 'excellent' ? 'selected' : '' }}>Excellent</option>
                            <option value="good" {{ old('condition') == 'good' ? 'selected' : '' }}>Good</option>
                            <option value="fair" {{ old('condition') == 'fair' ? 'selected' : '' }}>Fair</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Desired value (USD) *</label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input type="number" name="estimated_value" class="form-control @error('estimated_value') is-invalid @enderror"
                                   value="{{ old('estimated_value') }}" min="1000" step="100" required
                                   placeholder="How much you believe it's worth" data-demo-value="15000">
                            @error('estimated_value')<div class="invalid-feedback">{{ $message }}</div>@enderror
                        </div>
                        <small class="text-muted">Final value will be defined by admin evaluation.</small>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Description *</label>
                    <textarea name="description" class="form-control @error('description') is-invalid @enderror"
                              rows="3" required placeholder="Describe the asset: condition, accessories, certificates..."
                              data-demo-value="2022 Rolex Submariner Date 126610LN — black dial, ceramic bezel. Includes original box, papers, and service receipts. Mint condition, lightly worn.">{{ old('description') }}</textarea>
                    @error('description')<div class="invalid-feedback">{{ $message }}</div>@enderror
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Photos @if(empty($demoFill))<span class="text-danger">*</span>@endif</label>
                    <input type="file" name="photos[]" class="form-control @error('photos.*') is-invalid @enderror" multiple accept="image/*" @if(empty($demoFill)) required @endif>
                    <small class="text-muted">@if(!empty($demoFill))Stock Rolex image will be attached automatically for this demo run.@else Required: dial (2×), sides, caseback, bracelet, assembly. Up to 6 photos, 2MB each.@endif</small>
                    @error('photos.*')<div class="invalid-feedback d-block">{{ $message }}</div>@enderror
                    @error('photos')<div class="invalid-feedback d-block">{{ $message }}</div>@enderror
                </div>

                <div class="mb-3">
                    <label class="form-label fw-semibold">Video <small class="text-muted fw-normal">(10s of the seconds hand)</small></label>
                    <input type="file" name="video" class="form-control @error('video') is-invalid @enderror" accept="video/*">
                    <small class="text-muted">MP4/MOV/WebM, max 15MB.</small>
                    @error('video')<div class="invalid-feedback d-block">{{ $message }}</div>@enderror
                </div>

                <div class="alert alert-info small">
                    <i class="bi bi-info-circle me-1"></i>
                    After registration, your asset will have status <strong>"Pending Evaluation"</strong>.
                    The admin will evaluate and set the official value. You will be notified when the evaluation is complete.
                </div>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-gf px-4"><i class="bi bi-send me-1"></i>Submit for Evaluation</button>
                    <a href="{{ route('borrower.dashboard') }}" class="btn btn-outline-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div>

@if(!empty($demoFill))
    {{-- Demo autofill: typewriter-fills every [data-demo-value] field and
         submits the form. Driven entirely client-side; the server-side
         pair is the `_demo_fill` hidden input above (which lets storeAsset
         attach a stub photo without needing a real file upload). --}}
    @push('scripts')
    <script>
    (function () {
        const FAST       = {{ !empty($demoFast) ? 'true' : 'false' }};
        const NO_SUBMIT  = {{ !empty($demoNoSubmit) ? 'true' : 'false' }};
        const FINAL_PAUSE_MS = 1200;
        const TYPE_SPEED_MS  = FAST ? 0 : 25;   // ms per char
        const FIELD_STAGGER  = FAST ? 50 : 350; // gap between fields starting

        const fields = Array.from(document.querySelectorAll('[data-demo-value]'));

        function fillSelect(el, value) {
            el.value = value;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return Promise.resolve();
        }

        function typeText(el, value, speed) {
            return new Promise((resolve) => {
                if (speed === 0) {
                    el.value = value;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    return resolve();
                }
                let i = 0;
                const step = () => {
                    if (i >= value.length) {
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        return resolve();
                    }
                    el.value = value.slice(0, i + 1);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    i++;
                    setTimeout(step, speed);
                };
                step();
            });
        }

        async function run() {
            for (let i = 0; i < fields.length; i++) {
                const el = fields[i];
                const value = el.dataset.demoValue;
                if (el.tagName === 'SELECT') {
                    await fillSelect(el, value);
                } else {
                    await typeText(el, value, TYPE_SPEED_MS);
                }
                if (i < fields.length - 1) {
                    await new Promise(r => setTimeout(r, FIELD_STAGGER));
                }
            }
            await new Promise(r => setTimeout(r, FINAL_PAUSE_MS));
            if (!NO_SUBMIT) {
                const form = document.getElementById('asset-form');
                if (form) form.submit();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    })();
    </script>
    @endpush
@endif
@endsection
