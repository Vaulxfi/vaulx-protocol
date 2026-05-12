@props(['asset'])

@php
    $guide = \App\Support\AssetStatusGuide::for($asset);
@endphp

@if($guide['eta_label'] || $guide['text'])
    @php
        // Tone → colour mapping. Kept inline so this component is self-contained.
        $toneColor = match ($guide['kind']) {
            'action'  => 'var(--vx-text)',          // ink — needs your action
            'warning' => 'var(--gf-danger)',        // red — overdue / problem
            'done'    => 'var(--vx-text-muted)',    // mute — completed
            default   => 'var(--vx-teal, #0E7C7B)', // teal — we're working on it
        };
        $weight = $guide['kind'] === 'action' ? 600 : 500;
    @endphp
    <div class="d-flex align-items-center gap-1 mt-2"
         style="font-size:11px;color:var(--vx-text-muted);font-style:italic;line-height:1.4;">
        @if($guide['eta_label'])
            <span style="color:{{ $toneColor }};
                         font-weight:{{ $weight }};
                         font-style:normal;
                         font-family:'JetBrains Mono', ui-monospace, monospace;
                         letter-spacing:.06em;
                         font-size:10px;">{{ $guide['eta_label'] }}</span>
        @endif
        @if($guide['text'])
            <span class="ms-1">· {{ $guide['text'] }}</span>
        @endif
    </div>
@endif
