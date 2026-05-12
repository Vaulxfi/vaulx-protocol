@props([
    'color' => 'secondary',
    'label' => '',
])

<span {{ $attributes->merge(['class' => "badge bg-{$color}"]) }}>{{ $label }}</span>
