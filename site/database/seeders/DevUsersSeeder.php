<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['marcelo@gitel.com.br', 'Marcelo Coelho', 'admin', 'admin123'],
            ['online@vaulx.fi', 'Online Eva', 'evaluator_online', 'admin123'],
            ['offline@vaulx.fi', 'Offline Oscar', 'evaluator_offline', 'admin123'],
            ['user@vaulx.fi', 'Test Borrower', 'borrower', 'user123'],
        ];

        foreach ($users as [$email, $name, $role, $pw]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make($pw),
                    'role' => $role,
                    'auth_provider' => 'email',
                ]
            );
        }

        $this->command?->info('Seeded 4 dev users.');
    }
}
