@props([
    'onlineScore' => null,
    'offlineScore' => null,
    'marketLabel' => 'Market',
])

<svg viewBox="0 0 220 200" {{ $attributes->merge(['class' => 'w-100']) }} style="max-width:340px;margin:0 auto;display:block">
    {{-- Triangle sides --}}
    <line x1="110" y1="30" x2="40" y2="170" stroke="var(--vx-gold)" stroke-width="1" opacity="0.45"/>
    <line x1="110" y1="30" x2="180" y2="170" stroke="var(--vx-gold)" stroke-width="1" opacity="0.45"/>
    <line x1="40" y1="170" x2="180" y2="170" stroke="var(--vx-gold)" stroke-width="1" opacity="0.45"/>

    {{-- Market node (top) --}}
    <circle cx="110" cy="30" r="22" fill="var(--vx-surface)" stroke="var(--vx-gold)" stroke-width="1.5"/>
    <text x="110" y="35" text-anchor="middle" fill="var(--vx-gold)" font-size="10" font-weight="600">{{ $marketLabel }}</text>

    {{-- Online node (bottom-left) --}}
    <circle cx="40" cy="170" r="22" fill="var(--vx-surface)" stroke="var(--vx-champagne)" stroke-width="1.5"/>
    <text x="40" y="168" text-anchor="middle" fill="var(--vx-champagne)" font-size="8">Online</text>
    <text x="40" y="180" text-anchor="middle" fill="var(--vx-text)" font-size="11" font-weight="700">{{ $onlineScore ?? '—' }}</text>

    {{-- Offline node (bottom-right) --}}
    <circle cx="180" cy="170" r="22" fill="var(--vx-surface)" stroke="var(--vx-champagne)" stroke-width="1.5"/>
    <text x="180" y="168" text-anchor="middle" fill="var(--vx-champagne)" font-size="8">Offline</text>
    <text x="180" y="180" text-anchor="middle" fill="var(--vx-text)" font-size="11" font-weight="700">{{ $offlineScore ?? '—' }}</text>
</svg>
