<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
            'role' => 'borrower',
            'auth_provider' => 'email',
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): Factory
    {
        return $this->state(fn () => ['role' => 'admin']);
    }

    public function solana(?string $pubkey = null): Factory
    {
        $pk = $pubkey ?? $this->faker->regexify('[A-HJ-NP-Za-km-z1-9]{43}');
        return $this->state(fn () => [
            'auth_provider' => 'solana',
            'solana_pubkey' => $pk,
            'wallet_address' => $pk,
        ]);
    }
}
