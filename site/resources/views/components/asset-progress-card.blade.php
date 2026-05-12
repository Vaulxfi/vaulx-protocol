@props(['assets'])

@php
    // Filter to only assets that need user attention or are in motion.
    // Skip 'done' and rows with no message — they don't belong in this card.
    $rows = collect($assets)
        ->map(fn ($a) => ['asset' => $a, 'guide' => \App\Support\AssetStatusGuide::journey($a)])
        ->filter(fn ($r) => $r['guide']['kind'] !== 'done' && $r['guide']['text'])
        ->values();
@endphp

@if($rows->isNotEmpty())
<div class="card mb-4 p-0" style="border:1.5px solid var(--vx-text);background:var(--vx-surface)">
    <div class="d-flex align-items-center gap-2 px-4 py-3"
         style="border-bottom:1px solid var(--vx-border);
                font-family:'JetBrains Mono', ui-monospace, monospace;
                font-size:11px;font-weight:600;letter-spacing:.14em;
                text-transform:uppercase;color:var(--vx-text)">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--vx-teal,#0E7C7B);display:inline-block"></span>
        What's happening with your assets
    </div>

    @foreach($rows as $row)
        @php
            $a = $row['asset'];
            $g = $row['guide'];
            $stepLabel = $g['step_titles'][$g['current_step']] ?? '';
            $isAction = in_array($g['kind'], ['action', 'warning']);
            $accentColor = match($g['kind']) {
                'action'  => 'var(--vx-text)',
                'warning' => 'var(--gf-danger,#B8412C)',
                default   => 'var(--vx-teal,#0E7C7B)',
            };
        @endphp
        <div class="px-4 py-3 d-flex align-items-center gap-3" style="border-bottom:1px solid var(--vx-border-soft, rgba(10,10,11,.06))">
            <div class="flex-grow-1">
                <div class="fw-semibold" style="font-size:15px;color:var(--vx-text)">{{ $a->brand }} {{ $a->model }}</div>
                <div class="mt-1" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:{{ $accentColor }};letter-spacing:.06em">
                    Step {{ $g['current_step'] }} of {{ $g['total_steps'] }} — {{ $stepLabel }}
                </div>
                <div class="mt-1" style="font-size:13px;color:var(--vx-text-muted)">{{ $g['text'] }}</div>
                <div class="mt-2" style="height:4px;background:var(--vx-surface-2);border-radius:2px;overflow:hidden;max-width:100%">
                    <div style="height:100%;background:{{ $accentColor }};width:{{ $g['progress_percent'] }}%;transition:width .3s ease"></div>
                </div>
                <div class="mt-1" style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--vx-text-muted);letter-spacing:.10em">
                    @if($isAction) ACTION REQUIRED FROM YOU @else {{ strtoupper($g['eta_label'] ?? 'IN PROGRESS') }} @endif
                </div>
            </div>
            <div class="d-flex flex-column gap-1">
                <a href="{{ route('borrower.asset.show', $a) }}"
                   class="btn btn-sm {{ $isAction ? 'btn-gf' : 'btn-outline-secondary' }}">
                    @if($isAction) Take action @else View @endif
                </a>
            </div>
        </div>
    @endforeach
</div>
@endif
