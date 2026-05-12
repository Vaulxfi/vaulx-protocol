@props([
    'title' => '',
    'subtitle' => null,
])

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h4 class="mb-0 fw-bold">{{ $title }}</h4>
        @if($subtitle)<small class="text-muted">{!! $subtitle !!}</small>@endif
    </div>
    <div class="d-flex gap-2 align-items-center">{{ $slot }}</div>
</div>
