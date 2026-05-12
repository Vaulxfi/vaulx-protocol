@props([
    'label' => '',
    'value' => null,
    'variant' => null,
    'hint' => null,
    'icon' => null,
])

@php
    $variantClass = $variant ? " {$variant}" : '';
@endphp

<div {{ $attributes->merge(['class' => "card stat-card{$variantClass} p-3"]) }}>
    <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
            <small class="text-muted">{{ $label }}</small>
            <h3 class="fw-bold mb-0">{{ $value }}</h3>
            @if($hint)<small class="text-muted d-block">{{ $hint }}</small>@endif
        </div>
        @if($icon)
            <i class="bi bi-{{ $icon }}" style="font-size:1.5rem;color:var(--gf-primary);opacity:.3"></i>
        @endif
    </div>
</div>
