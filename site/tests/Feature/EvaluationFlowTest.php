<?php

use App\Models\Asset;
use App\Models\Evaluation;
use App\Models\User;
use App\Notifications\SuspiciousAlignmentDetected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function makeAsset(User $owner, array $attrs = []): Asset
{
    return Asset::create(array_merge([
        'user_id' => $owner->id,
        'category' => 'watch',
        'brand' => 'Rolex',
        'model' => 'Submariner',
        'reference_number' => '126610LN',
        'serial_number' => 'X1234',
        'description' => 'Full-set 2023',
        'condition' => 'excellent',
        'estimated_value' => 10000,
        'custody_status' => 'pending_evaluation',
    ], $attrs));
}

it('borrower cannot access evaluator dashboard', function () {
    $borrower = User::factory()->create();
    $this->actingAs($borrower);
    $this->get('/evaluator')->assertForbidden();
});

it('evaluator_online can access unified dashboard', function () {
    $user = User::factory()->create(['role' => 'evaluator_online']);
    $this->actingAs($user);
    $this->get('/evaluator')->assertOk();
});

it('evaluator_online cannot access offline-specific routes', function () {
    $user = User::factory()->create(['role' => 'evaluator_online']);
    $this->actingAs($user);
    $this->get('/evaluator/offline')->assertForbidden();
});

it('admin can access unified evaluator dashboard', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin);
    $this->get('/evaluator')->assertOk();
});

it('full evaluation flow: online → owner range → offline → consolidated', function () {
    Notification::fake();

    $owner = User::factory()->create();
    $online = User::factory()->create(['role' => 'evaluator_online']);
    $offline = User::factory()->create(['role' => 'evaluator_offline']);
    $admin = User::factory()->admin()->create();

    $asset = makeAsset($owner);
    $snapshot = \App\Models\MarketSnapshot::create([
        'asset_id' => $asset->id,
        'reference_number' => '126610LN',
        'median_usd' => 10000,
        'min_usd' => 8500,
        'max_usd' => 12000,
        'listings_count' => 20,
        'trend' => 'stable',
        'brl_factor' => 1.0,
        'captured_at' => now(),
    ]);
    $eval = Evaluation::create([
        'asset_id' => $asset->id,
        'market_snapshot_id' => $snapshot->id,
        'online_evaluator_id' => $online->id,
        'offline_evaluator_id' => $offline->id,
        'status' => Evaluation::STATUS_PENDING_ONLINE,
    ]);

    // 1. Online evaluator submits
    $this->actingAs($online);
    $this->post("/evaluator/online/{$eval->id}", [
        'value_usd' => 10200,
        'grade' => 'ex',
        'has_box' => 1, 'has_papers' => 1,
        'dial_grade' => 'ex','case_grade' => 'ex','bracelet_grade' => 'ex','glass_grade' => 'ex','crown_grade' => 'ex',
    ])->assertRedirect();

    $eval->refresh();
    expect($eval->status)->toBe(Evaluation::STATUS_PENDING_OWNER);
    expect((float) $eval->range_min)->toBeGreaterThan(0);
    expect((float) $eval->range_max)->toBeGreaterThan((float) $eval->range_min);

    // 2. Owner sees range and advances
    $this->actingAs($owner);
    $this->get("/evaluation/{$asset->id}/range")->assertOk();
    $this->post("/evaluation/{$asset->id}/decide", ['decision' => 'advance'])->assertRedirect();
    expect($eval->fresh()->status)->toBe(Evaluation::STATUS_PENDING_OFFLINE);

    // 3. Offline evaluator submits
    $this->actingAs($offline);
    $this->post("/evaluator/offline/{$eval->id}", [
        'value_usd' => 10400,
        'grade' => 'ex',
        'has_box' => 1, 'has_papers' => 1,
        'caliber' => '3235',
        'serial_match' => 1,
        'authenticity' => 'authentic',
        'timing_rate' => 2.0,
    ])->assertRedirect();

    $eval->refresh();
    expect($eval->status)->toBe(Evaluation::STATUS_CONSOLIDATED)
        ->and($eval->onlineReport->scores)->toHaveKey('m1')
        ->and($eval->offlineReport->scores)->toHaveKey('m6');
});

it('suspicious alignment triggers admin notification', function () {
    Notification::fake();

    $owner = User::factory()->create();
    $online = User::factory()->create(['role' => 'evaluator_online']);
    $offline = User::factory()->create(['role' => 'evaluator_offline']);
    $admin = User::factory()->admin()->create();

    $asset = makeAsset($owner);
    $snapshot = \App\Models\MarketSnapshot::create([
        'asset_id' => $asset->id,
        'reference_number' => '126610LN',
        'median_usd' => 10000, 'min_usd' => 8500, 'max_usd' => 12000,
        'listings_count' => 20, 'trend' => 'stable', 'brl_factor' => 1.0,
        'captured_at' => now(),
    ]);
    $eval = Evaluation::create([
        'asset_id' => $asset->id,
        'market_snapshot_id' => $snapshot->id,
        'online_evaluator_id' => $online->id,
        'offline_evaluator_id' => $offline->id,
        'status' => Evaluation::STATUS_PENDING_ONLINE,
    ]);

    // Both evaluators submit 14000 — convergent but 40% off market median (10k)
    $this->actingAs($online);
    $this->post("/evaluator/online/{$eval->id}", [
        'value_usd' => 14000, 'grade' => 'ex', 'dial_grade' => 'ex',
        'case_grade' => 'ex', 'bracelet_grade' => 'ex', 'glass_grade' => 'ex', 'crown_grade' => 'ex',
    ]);

    $this->actingAs($owner);
    $this->post("/evaluation/{$asset->id}/decide", ['decision' => 'advance']);

    $this->actingAs($offline);
    $this->post("/evaluator/offline/{$eval->id}", [
        'value_usd' => 14050, 'grade' => 'ex', 'caliber' => '3235',
        'serial_match' => 1, 'authenticity' => 'authentic',
    ]);

    Notification::assertSentTo($admin, SuspiciousAlignmentDetected::class);
});
