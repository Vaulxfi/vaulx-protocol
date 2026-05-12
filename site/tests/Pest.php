<?php

use Tests\TestCase;

uses(TestCase::class)->in('Feature', 'Unit');

/**
 * @see https://pestphp.com/docs/expectations
 */
expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/**
 * Helpers
 */
function actingAsAdmin(): \App\Models\User
{
    $user = \App\Models\User::factory()->create(['role' => 'admin']);
    test()->actingAs($user);
    return $user;
}

function actingAsBorrower(): \App\Models\User
{
    $user = \App\Models\User::factory()->create(['role' => 'borrower']);
    test()->actingAs($user);
    return $user;
}
