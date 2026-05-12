<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // --- Admin ---
        $admin = User::create([
            'name' => 'Admin GarantiFi',
            'email' => 'admin@garantifi.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '(11) 99999-0000',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // --- Borrower 1: Carlos ---
        $borrower1 = User::create([
            'name' => 'Carlos Mendes',
            'email' => 'carlos@demo.com',
            'password' => Hash::make('password'),
            'role' => 'borrower',
            'cpf_cnpj' => '123.456.789-00',
            'phone' => '(11) 98765-4321',
            'wallet_address' => '7xKXt9b2Qf3a1YwZ8pLmNcR4Ds5VeH6jU0gTiWo',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Rolex: avaliado, com empréstimo ativo
        $asset1 = Asset::create([
            'user_id' => $borrower1->id,
            'category' => 'watch',
            'brand' => 'Rolex',
            'model' => 'Submariner Date 126610LN',
            'serial_number' => 'RLX-2024-78542',
            'description' => 'Rolex Submariner Date em aco inoxidavel, luneta ceramica preta, movimento calibre 3235. Completo com caixa e documentos.',
            'year' => 2024,
            'condition' => 'excellent',
            'estimated_value' => 15000.00,
            'appraised_value' => 14500.00,
            'appraiser' => 'Admin GarantiFi',
            'appraisal_date' => '2026-03-15',
            'custody_status' => 'in_custody',
            'custody_location' => 'Cofre GarantiFi #001 — Sao Paulo, SP',
            'custody_received_at' => Carbon::parse('2026-03-20'),
            'nft_mint_address' => '7xKXtQ9b2f3a1YwZ8pLmNcR4Ds5VeH6jU0gTiWoA',
            'metadata_uri' => 'https://arweave.net/demo_rolex_submariner_metadata_json',
            'mint_tx_hash' => '5wHzJ3tLpN8mK0vFdR2cX4qYb7sU1aG9eW6iToP3kMnBvCxZyA8fDgHjL2rS4qW5tY7uI0oP9aS3dF6gH8jK1lZ',
        ]);

        $loan1 = Loan::create([
            'code' => 'GF-2026-00001',
            'user_id' => $borrower1->id,
            'asset_id' => $asset1->id,
            'approved_by' => $admin->id,
            'status' => 'active',
            'asset_value' => 14500.00,
            'ltv_percent' => 55.00,
            'principal' => 7975.00,
            'interest_rate' => 24.00,
            'origination_fee_percent' => 2.50,
            'origination_fee' => 199.38,
            'term_months' => 12,
            'start_date' => Carbon::parse('2026-03-20'),
            'due_date' => Carbon::parse('2027-03-20'),
            'total_repaid' => 709.00,
            'outstanding_balance' => 7266.00,
            'currency' => 'USDC',
            'escrow_address' => '9pQrLb4Kc7Wz1xY5mN8dV2fJ6hT0sA3gE9iR4tU',
            'disbursement_tx_hash' => '2kFnJ8bVpL3mH7xR0cS4wQ6tY9zA1dG5eI8oU7rT3yWzXcBnMaLsK0fDgHjP2qV4sE6wR8tY0uI3oP5aS7dF9g',
            'approved_at' => Carbon::parse('2026-03-20 10:30:00'),
            'disbursed_at' => Carbon::parse('2026-03-20 10:35:00'),
        ]);

        $this->generateInstallments($loan1, 1);

        // Porsche: avaliado + empréstimo quitado + released
        $asset3 = Asset::create([
            'user_id' => $borrower1->id,
            'category' => 'vehicle',
            'brand' => 'Porsche',
            'model' => '911 Carrera S (992)',
            'serial_number' => 'WP0AB2A99NS123456',
            'description' => 'Porsche 911 Carrera S 2022, preto, 15.000km, PDK, pacote Sport Chrono. IPVA pago.',
            'year' => 2022,
            'condition' => 'excellent',
            'estimated_value' => 120000.00,
            'appraised_value' => 115000.00,
            'appraiser' => 'Admin GarantiFi',
            'appraisal_date' => '2025-12-01',
            'custody_status' => 'released',
            'custody_location' => 'Garagem GarantiFi #002 — Sao Paulo, SP',
            'nft_mint_address' => 'LmNcR4Ds5VeH6jU0gTiWo7xKXt9b2Qf3a1YwZ8p',
            'metadata_uri' => 'https://arweave.net/demo_porsche_911_metadata_json',
            'mint_tx_hash' => 'X4qYb7sU1aG9eW6iToP3kMnBvCxZyA8fDgHjL2rS4qW5tY7uI0oP9aS3dF6gH8jK1lZ5wHzJ3tLpN8mK0vFdR2c',
        ]);

        Loan::create([
            'code' => 'GF-2025-00001',
            'user_id' => $borrower1->id,
            'asset_id' => $asset3->id,
            'approved_by' => $admin->id,
            'status' => 'repaid',
            'asset_value' => 115000.00,
            'ltv_percent' => 50.00,
            'principal' => 57500.00,
            'interest_rate' => 24.00,
            'origination_fee_percent' => 2.50,
            'origination_fee' => 1437.50,
            'term_months' => 6,
            'start_date' => Carbon::parse('2025-12-05'),
            'due_date' => Carbon::parse('2026-06-05'),
            'total_repaid' => 57500.00,
            'outstanding_balance' => 0,
            'currency' => 'BRZ',
            'escrow_address' => 'R4Ds5VeH6jU0gTiWo7xKXt9b2Qf3a1YwZ8pLmNc',
            'disbursement_tx_hash' => 'kMnBvCxZyA8fDgHjL2rS4qW5tY7uI0oP9aS3dF6gH8jK1lZ5wHzJ3tLpN8mK0vFdR2cX4qYb7sU1aG9eW6iToP3',
            'repayment_tx_hash' => 'A8fDgHjL2rS4qW5tY7uI0oP9aS3dF6gH8jK1lZ5wHzJ3tLpN8mK0vFdR2cX4qYb7sU1aG9eW6iToP3kMnBvCxZy',
            'approved_at' => Carbon::parse('2025-12-05 14:00:00'),
            'disbursed_at' => Carbon::parse('2025-12-05 14:05:00'),
            'repaid_at' => Carbon::parse('2026-03-10 09:00:00'),
        ]);

        // --- Borrower 2: Ana — Joia avaliada, empréstimo pending_custody ---
        $borrower2 = User::create([
            'name' => 'Ana Beatriz Silva',
            'email' => 'ana@demo.com',
            'password' => Hash::make('password'),
            'role' => 'borrower',
            'cpf_cnpj' => '987.654.321-00',
            'phone' => '(21) 97654-3210',
            'wallet_address' => '3mNcR4Ds5VeH6jU0gTiWo7xKXt9b2Qf3a1YwZ8p',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $asset2 = Asset::create([
            'user_id' => $borrower2->id,
            'category' => 'jewelry',
            'brand' => 'Tiffany & Co',
            'model' => 'Solitario Diamante 2ct',
            'serial_number' => 'TIF-2023-44210',
            'description' => 'Anel solitario Tiffany Setting com diamante de 2 quilates, cor D, pureza IF. Certificado GIA.',
            'year' => 2023,
            'condition' => 'excellent',
            'estimated_value' => 45000.00,
            'appraised_value' => 42000.00,
            'appraiser' => 'Admin GarantiFi',
            'appraisal_date' => '2026-04-10',
            'custody_status' => 'evaluated',
            'custody_location' => 'Cofre GarantiFi #001 — Sao Paulo, SP',
            'nft_mint_address' => '4Ds5VeH6jU0gTiWo7xKXt9b2Qf3a1YwZ8pLmNcR',
            'metadata_uri' => 'https://arweave.net/demo_tiffany_ring_metadata_json',
            'mint_tx_hash' => '8mK0vFdR2cX4qYb7sU1aG9eW6iToP3kMnBvCxZyA5wHzJ3tLpN8fDgHjL2rS4qW5tY7uI0oP9aS3dF6gH8jK1l',
        ]);

        Loan::create([
            'code' => 'GF-2026-00002',
            'user_id' => $borrower2->id,
            'asset_id' => $asset2->id,
            'status' => 'pending_custody',
            'asset_value' => 42000.00,
            'ltv_percent' => 53.57,
            'principal' => 22500.00,
            'interest_rate' => 24.00,
            'origination_fee_percent' => 2.50,
            'origination_fee' => 562.50,
            'term_months' => 18,
            'outstanding_balance' => 22500.00,
            'currency' => 'USDC',
            'escrow_address' => 'Hj6U0gTiWo7xKXt9b2Qf3a1YwZ8pLmNcR4Ds5Ve',
        ]);

        // --- Borrower 3: Roberto — Arte aguardando avaliação ---
        $borrower3 = User::create([
            'name' => 'Roberto Almeida',
            'email' => 'roberto@demo.com',
            'password' => Hash::make('password'),
            'role' => 'borrower',
            'cpf_cnpj' => '456.789.123-00',
            'phone' => '(31) 96543-2100',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        Asset::create([
            'user_id' => $borrower3->id,
            'category' => 'art',
            'brand' => 'Romero Britto',
            'model' => 'The Hug (Original)',
            'description' => 'Pintura original a oleo sobre tela "The Hug" de Romero Britto, 120x90cm, com certificado de autenticidade e procedencia.',
            'year' => 2019,
            'condition' => 'excellent',
            'estimated_value' => 85000.00,
            'custody_status' => 'pending_evaluation',
            'nft_mint_address' => 'VeH6jU0gTiWo7xKXt9b2Qf3a1YwZ8pLmNcR4Ds5',
            'metadata_uri' => 'https://arweave.net/demo_britto_the_hug_metadata_json',
            'mint_tx_hash' => 'ToP3kMnBvCxZyA8fDgHjL2rS4qW5tY7uI0oP9aS3dF6gH8jK1lZ5wHzJ3tLpN8mK0vFdR2cX4qYb7sU1aG9eW6i',
        ]);

        // --- Borrower 2: segundo bem avaliado e disponível para empréstimo ---
        Asset::create([
            'user_id' => $borrower2->id,
            'category' => 'watch',
            'brand' => 'Patek Philippe',
            'model' => 'Nautilus 5711/1A',
            'serial_number' => 'PP-2021-91003',
            'description' => 'Patek Philippe Nautilus em aco, mostrador azul gradiente, completo com caixa e papeis.',
            'year' => 2021,
            'condition' => 'excellent',
            'estimated_value' => 95000.00,
            'appraised_value' => 88000.00,
            'appraiser' => 'Admin GarantiFi',
            'appraisal_date' => '2026-04-12',
            'custody_status' => 'evaluated',
            'custody_location' => 'Cofre GarantiFi #001 — Sao Paulo, SP',
            'nft_mint_address' => 'Qf3a1YwZ8pLmNcR4Ds5VeH6jU0gTiWo7xKXt9b2',
            'metadata_uri' => 'https://arweave.net/demo_patek_nautilus_metadata_json',
            'mint_tx_hash' => 'J3tLpN8mK0vFdR2cX4qYb7sU1aG9eW6iToP3kMnBvCxZyA8fDgHjL2rS4qW5tY7uI0oP9aS3dF6gH8jK1lZ5wHz',
        ]);

        echo "Seeded: 1 admin, 3 borrowers, 5 assets (1 pending_evaluation, 2 evaluated, 1 in_custody, 1 released), 3 loans\n";
    }

    private function generateInstallments(Loan $loan, int $paidCount = 0)
    {
        $principal = (float) $loan->principal;
        $monthlyRate = ((float) $loan->interest_rate) / 100 / 12;
        $months = $loan->term_months;

        $monthly = $principal * ($monthlyRate * pow(1 + $monthlyRate, $months)) / (pow(1 + $monthlyRate, $months) - 1);

        $balance = $principal;
        $startDate = Carbon::parse($loan->start_date);

        for ($i = 1; $i <= $months; $i++) {
            $interestPortion = round($balance * $monthlyRate, 2);
            $principalPortion = round($monthly - $interestPortion, 2);
            $balance = max(0, round($balance - $principalPortion, 2));

            $isPaid = $i <= $paidCount;
            $dueDate = $startDate->copy()->addMonths($i);

            LoanPayment::create([
                'loan_id' => $loan->id,
                'installment_number' => $i,
                'amount_due' => round($monthly, 2),
                'principal_portion' => $principalPortion,
                'interest_portion' => $interestPortion,
                'amount_paid' => $isPaid ? round($monthly, 2) : 0,
                'due_date' => $dueDate,
                'paid_at' => $isPaid ? $dueDate : null,
                'status' => $isPaid ? 'paid' : ($dueDate->isPast() ? 'overdue' : 'pending'),
                'tx_hash' => $isPaid ? Str::random(87) : null,
            ]);
        }
    }
}
