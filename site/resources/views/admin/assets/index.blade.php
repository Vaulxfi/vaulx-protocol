@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Assets Pending Evaluation')
@section('page-subtitle', 'Evaluate assets submitted by clients')

@section('panel-content')
<div class="card p-4">
    @if($assets->isEmpty())
        <x-empty-state icon="check-circle" title="All caught up" description="No assets pending evaluation right now." />
    @else
        <div class="table-responsive">
            <table class="table align-middle">
                <thead><tr><th>Asset</th><th>Category</th><th>Condition</th><th>Requested value</th><th>Client</th><th>Submitted at</th><th></th></tr></thead>
                <tbody>
                @foreach($assets as $asset)
                    <tr>
                        <td>
                            <strong>{{ $asset->brand }} {{ $asset->model }}</strong>
                            @if($asset->serial_number)<br><small class="text-muted">S/N: {{ $asset->serial_number }}</small>@endif
                        </td>
                        <td><span class="badge bg-light text-dark">{{ $asset->category_label }}</span></td>
                        <td>{{ ucfirst($asset->condition) }}</td>
                        <td>${{ number_format($asset->estimated_value, 2) }}</td>
                        <td>{{ $asset->user->name }}</td>
                        <td>{{ $asset->created_at->format(config('app.datetime_format')) }}</td>
                        <td>
                            <a href="{{ route('admin.asset.evaluate', $asset) }}" class="btn btn-sm btn-gf">
                                <i class="bi bi-clipboard-check me-1"></i>Evaluate
                            </a>
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
        {{ $assets->links() }}
    @endif
</div>
@endsection
