<?php

use App\Services\CurrencyService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $stub = new class extends CurrencyService {
        protected function fetchUsdBrl(): float { return 5.0; }
        protected function fetchBrzUsd(): float { return 0.2; }
    };
    $this->app->instance(CurrencyService::class, $stub);
});

it('GET /api/rates returns snapshot', function () {
    $response = $this->getJson('/api/rates');
    $response->assertOk();
    $response->assertJsonStructure(['usd_brl', 'brz_usd', 'brz_brl', 'depeg_pct', 'as_of']);
});

it('GET /api/rates/brz-monitor classifies depeg at normal tier', function () {
    $response = $this->getJson('/api/rates/brz-monitor');
    $response->assertOk();
    $response->assertJsonPath('tier', 'normal');
    $response->assertJsonPath('paused', false);
});

it('GET /api/rates/brz-monitor classifies depeg at paused when < -3%', function () {
    $stub = new class extends CurrencyService {
        protected function fetchUsdBrl(): float { return 5.0; }
        protected function fetchBrzUsd(): float { return 0.193; } // brz_brl = 0.965, depeg = -3.5%
    };
    $this->app->instance(CurrencyService::class, $stub);

    $response = $this->getJson('/api/rates/brz-monitor');
    $response->assertJsonPath('tier', 'paused');
    $response->assertJsonPath('paused', true);
});
