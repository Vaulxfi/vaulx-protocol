<?php

use App\Services\CurrencyService;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
});

it('caches usd-brl rate so second call does not hit the network', function () {
    $svc = new class extends CurrencyService {
        public int $hits = 0;
        protected function fetchUsdBrl(): float { $this->hits++; return 5.2345; }
        protected function fetchBrzUsd(): float { return 0.191; }
    };
    $a = $svc->usdToBrl();
    $b = $svc->usdToBrl();
    expect($a)->toBe($b)->and($svc->hits)->toBe(1);
});

it('converts USD to BRL using cached rate', function () {
    $svc = new class extends CurrencyService {
        protected function fetchUsdBrl(): float { return 5.0; }
        protected function fetchBrzUsd(): float { return 0.2; }
    };
    expect($svc->convertUsdToBrl(1000))->toBe(5000.00);
});

it('converts BRL to USD using cached rate', function () {
    $svc = new class extends CurrencyService {
        protected function fetchUsdBrl(): float { return 5.0; }
        protected function fetchBrzUsd(): float { return 0.2; }
    };
    expect($svc->convertBrlToUsd(5000))->toBe(1000.00);
});

it('calculates depeg % as (brz_brl - 1) * 100', function () {
    $svc = new class extends CurrencyService {
        protected function fetchUsdBrl(): float { return 5.0; }
        protected function fetchBrzUsd(): float { return 0.19; } // brz_brl = 0.95
    };
    expect($svc->depegPercent())->toBe(-5.0);
});

it('returns 0 depeg when brz_brl is exactly 1', function () {
    $svc = new class extends CurrencyService {
        protected function fetchUsdBrl(): float { return 5.0; }
        protected function fetchBrzUsd(): float { return 0.2; } // brz_brl = 1.0
    };
    expect($svc->depegPercent())->toBe(0.0);
});

it('snapshot returns all rates + as_of', function () {
    $svc = new class extends CurrencyService {
        protected function fetchUsdBrl(): float { return 5.0; }
        protected function fetchBrzUsd(): float { return 0.2; }
    };
    $snap = $svc->snapshot();
    expect($snap)->toHaveKeys(['usd_brl', 'brz_usd', 'brz_brl', 'depeg_pct', 'as_of']);
});

it('forceRefresh clears cache so next fetch is fresh', function () {
    $svc = new class extends CurrencyService {
        public int $hits = 0;
        protected function fetchUsdBrl(): float { $this->hits++; return 5.0; }
        protected function fetchBrzUsd(): float { return 0.2; }
    };
    $svc->usdToBrl();
    $svc->forceRefresh();
    $svc->usdToBrl();
    expect($svc->hits)->toBe(2);
});
