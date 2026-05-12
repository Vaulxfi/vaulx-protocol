@props(['name', 'size' => 80, 'color' => null])

@php
    // Initials = first letter of first word + first letter of last word.
    $words = preg_split('/\s+/', trim($name)) ?: [];
    $first = $words[0] ?? '';
    $last = end($words) ?: '';
    $initials = strtoupper(mb_substr($first, 0, 1) . mb_substr($last, 0, 1));

    // Colour: explicit prop wins. Otherwise stable hash of the name into
    // a brand-safe palette so a list of avatars feels like a set, not
    // random pastels.
    if (!$color) {
        $palette = ['#0E7C7B', '#2BA09E', '#0A0A0B', '#3A3A40', '#6B6B70', '#1A1A1D'];
        $color = $palette[abs(crc32($name)) % count($palette)];
    }

    $fontPx = (int) round($size * 0.36);
@endphp

<div {{ $attributes->merge(['class' => 'd-inline-flex align-items-center justify-content-center']) }}
     style="width:{{ $size }}px;height:{{ $size }}px;border-radius:50%;
            background:{{ $color }};color:#FAFAF7;
            font-family:'Outfit', system-ui, sans-serif;
            font-weight:700;font-size:{{ $fontPx }}px;letter-spacing:-0.02em;
            user-select:none;flex-shrink:0;"
     aria-label="{{ $name }}">{{ $initials }}</div>
