@extends('layouts.app')

@section('content')
<div class="container-fluid">
    <div class="row">
        <nav class="col-md-2 d-none d-md-block sidebar">
            @yield('sidebar')
        </nav>

        {{-- Mobile offcanvas sidebar --}}
        <div class="offcanvas offcanvas-start d-md-none" tabindex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
            <div class="offcanvas-header" style="background:var(--gf-dark);color:#fff">
                <h5 class="offcanvas-title" id="mobileSidebarLabel">
                    <i class="bi bi-shield-lock-fill me-1"></i>vaul<span style="color:var(--vx-gold)">x</span>
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body sidebar p-0" style="min-height:auto">
                @yield('sidebar')
            </div>
        </div>

        <main class="col-md-10 ms-auto py-4 px-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="d-flex align-items-center">
                    <button class="btn btn-outline-dark btn-sm d-md-none me-2" type="button"
                            data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar"
                            aria-controls="mobileSidebar" aria-label="Open menu">
                        <i class="bi bi-list"></i>
                    </button>
                    <div>
                        <h4 class="mb-0 fw-bold">@yield('page-title')</h4>
                        <small class="text-muted">@yield('page-subtitle')</small>
                    </div>
                </div>
                <div class="d-flex gap-2 align-items-center">@yield('page-actions')</div>
            </div>
            @yield('panel-content')
        </main>
    </div>
</div>
@endsection
