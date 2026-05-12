<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('user can register and is logged in', function () {
    $response = $this->post('/register', [
        'name' => 'Alice',
        'email' => 'alice@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);
    $response->assertRedirect('/dashboard');
    expect(User::where('email', 'alice@example.com')->exists())->toBeTrue();
    $this->assertAuthenticated();
});

it('user can log in with email and password', function () {
    $user = User::factory()->create(['password' => bcrypt('secret123')]);
    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'secret123',
    ]);
    $response->assertRedirect('/dashboard');
    $this->assertAuthenticated();
});

it('wrong password rejects login', function () {
    $user = User::factory()->create(['password' => bcrypt('secret123')]);
    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('admin user is redirected to admin dashboard', function () {
    $user = User::factory()->admin()->create(['password' => bcrypt('pw')]);
    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'pw',
    ]);
    $response->assertRedirect('/admin');
});

it('forgot-password page renders', function () {
    $response = $this->get('/forgot-password');
    $response->assertOk();
    $response->assertSee('Send reset link');
});

it('forgot-password accepts valid email', function () {
    $user = User::factory()->create();
    $response = $this->post('/forgot-password', ['email' => $user->email]);
    $response->assertSessionHasNoErrors();
});
