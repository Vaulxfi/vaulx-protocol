@props([
    'icon' => 'inbox',
    'title' => 'Nothing here yet',
    'description' => null,
    'actionLabel' => null,
    'actionUrl' => null,
])

<div {{ $attributes->merge(['class' => 'empty-state']) }}>
    <i class="bi bi-{{ $icon }} empty-icon d-block"></i>
    <h5 class="fw-bold">{{ $title }}</h5>
    @if($description)
        <p>{{ $description }}</p>
    @endif
    @if($actionLabel && $actionUrl)
        <a href="{{ $actionUrl }}" class="btn btn-gf btn-sm">{{ $actionLabel }}</a>
    @endif
    {{ $slot }}
</div>
