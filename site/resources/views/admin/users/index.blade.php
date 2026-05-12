@extends('layouts.panel')
@section('sidebar') @include('admin.sidebar') @endsection
@section('page-title', 'Users')
@section('page-subtitle', 'All platform users')

@section('panel-content')
<div class="card p-4">
    <div class="table-responsive">
        <table class="table align-middle">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Tax ID</th><th>Assets</th><th>Loans</th><th>Signed up</th></tr></thead>
            <tbody>
            @foreach($users as $user)
                <tr>
                    <td><strong>{{ $user->name }}</strong></td>
                    <td>{{ $user->email }}</td>
                    <td><span class="badge bg-{{ $user->role === 'admin' ? 'primary' : 'secondary' }}">{{ $user->role }}</span></td>
                    <td>{{ $user->cpf_cnpj ?: '-' }}</td>
                    <td>{{ $user->assets_count }}</td>
                    <td>{{ $user->loans_count }}</td>
                    <td>{{ $user->created_at->format(config('app.date_format')) }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    {{ $users->links() }}
</div>
@endsection
