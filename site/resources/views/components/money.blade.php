@props([
    'amount' => 0,
    'currency' => 'USDC',
    'bold' => false,
    'color' => null,
])

@php
    $locale = $currency === 'BRZ' ? 'pt-BR' : 'en-US';
    $prefix = $currency === 'BRZ' ? 'R$ ' : '$';
    $formatter = new \NumberFormatter($locale, \NumberFormatter::DECIMAL);
    $formatter->setAttribute(\NumberFormatter::MIN_FRACTION_DIGITS, 2);
    $formatter->setAttribute(\NumberFormatter::MAX_FRACTION_DIGITS, 2);
    $formatted = $prefix . $formatter->format((float) $amount);
    $styles = $color ? "color:{$color}" : '';
@endphp

<span {{ $attributes->merge(['class' => $bold ? 'fw-bold' : '']) }} @if($styles) style="{{ $styles }}" @endif>{{ $formatted }}</span>
