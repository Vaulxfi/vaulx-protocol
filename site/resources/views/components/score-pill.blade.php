@props([
    'score' => null,
    'tier' => null,
])

@php
    $t = $tier ?? (is_null($score) ? 1 : \App\Models\EvaluatorScore::computeTier((float) $score));
    $color = ['1' => 'secondary', '2' => 'warning', '3' => 'info', '4' => 'success'][$t] ?? 'secondary';
@endphp

<span {{ $attributes->merge(['class' => "badge bg-{$color}"]) }} style="font-family:'Inter',sans-serif;letter-spacing:0.04em">
    Tier {{ $t }} · {{ is_null($score) ? '—' : number_format((float) $score, 1) }}
</span>
