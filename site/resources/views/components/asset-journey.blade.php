@props(['asset'])

@php
    $j = \App\Support\AssetStatusGuide::journey($asset);
    $current = $j['current_step'];
    $total = $j['total_steps'];
    $accent = match($j['kind']) {
        'action'  => 'var(--vx-text)',
        'warning' => 'var(--gf-danger,#B8412C)',
        'done'    => 'var(--vx-text-muted)',
        default   => 'var(--vx-teal,#0E7C7B)',
    };
    $stepDates = $j['step_dates'];
@endphp

<div class="card mb-4 p-4" style="background:var(--vx-surface);border:1px solid var(--vx-border)">

    {{-- TIMELINE: 6 dots connected --}}
    <div class="d-flex align-items-start position-relative" style="margin-bottom:32px">
        @foreach($j['step_titles'] as $stepNum => $stepTitle)
            @php
                $isDone = $stepNum < $current;
                $isCurrent = $stepNum === $current;
                $dateAt = $stepDates[$stepNum] ?? null;
                $whenLabel = $dateAt ? $dateAt->format('M d') : ($isCurrent ? 'Now' : '—');
                $dotBg = $isDone ? 'var(--vx-teal,#0E7C7B)' : ($isCurrent ? 'var(--vx-text)' : 'var(--vx-surface)');
                $dotBorder = $isDone ? 'var(--vx-teal,#0E7C7B)' : ($isCurrent ? 'var(--vx-text)' : 'var(--vx-text-subtle)');
                $dotShadow = $isCurrent ? 'box-shadow: 0 0 0 4px rgba(43,160,158,.10);' : '';
                $labelColor = $isCurrent ? 'var(--vx-text)' : ($isDone ? 'var(--vx-teal,#0E7C7B)' : 'var(--vx-text-muted)');
                $labelWeight = $isCurrent ? 700 : 500;
            @endphp
            <div class="flex-grow-1 text-center position-relative" style="z-index:1">
                <div class="mx-auto mb-2 d-flex align-items-center justify-content-center"
                     style="width:22px;height:22px;border-radius:50%;
                            background:{{ $dotBg }};
                            border:1.5px solid {{ $dotBorder }};
                            color:var(--vx-surface);
                            font-size:11px;
                            position:relative;z-index:2;
                            {{ $dotShadow }}">
                    @if($isDone)<span>✓</span>@endif
                </div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;
                            font-weight:{{ $labelWeight }};letter-spacing:.10em;
                            text-transform:uppercase;color:{{ $labelColor }}">{{ $stepTitle }}</div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;
                            color:var(--vx-text-subtle);margin-top:3px">{{ $whenLabel }}</div>

                {{-- connecting line to next dot --}}
                @if(!$loop->last)
                    <div style="position:absolute;top:11px;left:50%;right:-50%;height:1.5px;z-index:0;
                                background:{{ $isDone ? 'var(--vx-teal,#0E7C7B)' : 'var(--vx-border)' }}"></div>
                @endif
            </div>
        @endforeach
    </div>

    {{-- DETAIL BOX: Where you are / ETA / Who's acting / What you do --}}
    <div class="p-3 mb-3" style="background:rgba(43,160,158,.06);border-left:3px solid {{ $accent }}">
        <div class="row g-2" style="font-size:13px">
            <div class="col-md-4">
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--vx-text-muted)">Where you are</div>
                <div class="fw-semibold mt-1" style="color:var(--vx-text)">Step {{ $current }} of {{ $total }} — {{ $j['step_titles'][$current] ?? '' }}</div>
            </div>
            <div class="col-md-4">
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--vx-text-muted)">ETA</div>
                <div class="mt-1" style="color:var(--vx-text)">{{ $j['eta_label'] ?? '—' }}</div>
            </div>
            <div class="col-md-4">
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--vx-text-muted)">Who's acting</div>
                <div class="mt-1" style="color:var(--vx-text)">{{ $j['who_acting'] }}</div>
            </div>
            <div class="col-12 mt-2">
                <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--vx-text-muted)">What you do now</div>
                <div class="mt-1" style="color:var(--vx-text);font-weight:{{ in_array($j['kind'], ['action','warning']) ? 600 : 400 }}">{{ $j['what_you_do'] }}</div>
            </div>
        </div>
    </div>

    {{-- NEXT STEPS PREVIEW --}}
    @if(count($j['next_steps_preview']) > 0)
        <div>
            <div class="mb-2" style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--vx-text-muted)">What comes next</div>
            <ol class="ps-3 mb-0" style="font-size:13px;color:var(--vx-text-muted)">
                @foreach($j['next_steps_preview'] as $step)
                    <li class="mb-1"><strong style="color:var(--vx-text)">{{ $step['title'] }}</strong> — {{ $step['desc'] }}</li>
                @endforeach
            </ol>
        </div>
    @endif

</div>
