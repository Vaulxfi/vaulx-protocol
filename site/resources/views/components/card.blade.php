@props([
    'accent' => null,
    'padding' => 'p-4',
    'title' => null,
    'icon' => null,
])

@php
    $accentClass = $accent ? " card-accent {$accent}" : '';
@endphp

<div {{ $attributes->merge(['class' => "card{$accentClass} {$padding}"]) }}>
    @if($title)
        <h6 class="fw-bold mb-3">
            @if($icon)<i class="bi bi-{{ $icon }} me-2" style="color:var(--vx-gold)"></i>@endif
            {{ $title }}
        </h6>
    @endif
    {{ $slot }}
</div>
