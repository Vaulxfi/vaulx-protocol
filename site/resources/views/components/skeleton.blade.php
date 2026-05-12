@props([
    'rows' => 3,
    'cols' => 0,
    'height' => null,
])

@if($cols > 0)
    {{-- Table skeleton --}}
    <div {{ $attributes }}>
        @for($i = 0; $i < $rows; $i++)
            <div class="d-flex gap-2 mb-2">
                @for($j = 0; $j < $cols; $j++)
                    <div class="skeleton skeleton-line flex-fill"></div>
                @endfor
            </div>
        @endfor
    </div>
@else
    {{-- Generic block skeleton --}}
    <div {{ $attributes }}>
        @for($i = 0; $i < $rows; $i++)
            <div class="skeleton skeleton-line" @if($height) style="height:{{ $height }}" @endif></div>
        @endfor
    </div>
@endif
