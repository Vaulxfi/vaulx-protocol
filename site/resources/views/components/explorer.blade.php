@props([
    'type' => 'tx',
    'value' => null,
    'label' => null,
    'length' => 20,
    'fallback' => '-',
])

@php
    $network = config('garantifi.network', 'devnet');
    $base = rtrim(config('garantifi.explorer_url', 'https://explorer.solana.com'), '/');
    $cluster = $network !== 'mainnet' ? "?cluster={$network}" : '';
    $url = $value ? "{$base}/{$type}/{$value}{$cluster}" : null;
    $display = $label ?: ($value ? \Illuminate\Support\Str::limit($value, $length) . '…' : $fallback);
@endphp

@if($value)
    <a href="{{ $url }}" target="_blank" rel="noopener" {{ $attributes->merge(['class' => 'wallet-addr text-decoration-none']) }}>
        {{ $display }} <i class="bi bi-box-arrow-up-right" style="font-size:.7rem"></i>
    </a>
@else
    <span {{ $attributes->merge(['class' => 'wallet-addr']) }}>{{ $fallback }}</span>
@endif
