<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class TestFixtureSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'user@vaulx.fi')->first();
        if (!$user) {
            $this->command->warn('Borrower user@vaulx.fi missing — run DevUsersSeeder first.');
            return;
        }

        // Wipe existing test fixtures for idempotency
        Loan::where('user_id', $user->id)->forceDelete();
        Asset::where('user_id', $user->id)->forceDelete();

        // ---- Asset A: Rolex Submariner — repaid loan ready for re-loan + reengagement window ----
        $assetA = Asset::create([
            'user_id' => $user->id,
            'category' => 'watch',
            'brand' => 'Rolex',
            'model' => 'Submariner',
            'serial_number' => 'Z123456',
            'description' => '126610LN, 2022, full set, mint condition',
            'condition' => 'excellent',
            'estimated_value' => 15000,
            'appraised_value' => 15000,
            'appraiser' => 'Marcelo Coelho',
            'appraisal_date' => Carbon::today()->subDays(35),
            'custody_status' => 'released',
            'nft_mint_address' => Str::random(43),
            'metadata_uri' => 'https://arweave.net/' . Str::random(43),
            'mint_tx_hash' => Str::random(87),
        ]);

        $loanA = Loan::create([
            'code' => Loan::generateCode(),
            'user_id' => $user->id,
            'asset_id' => $assetA->id,
            'approved_by' => 1,
            'status' => 'repaid',
            'asset_value' => 15000,
            'ltv_percent' => 55,
            'principal' => 8250,
            'interest_rate' => 24.00,
            'origination_fee_percent' => 2.50,
            'origination_fee' => 206.25,
            'term_months' => 6,
            'start_date' => Carbon::today()->subDays(180),
            'due_date' => Carbon::today()->subDays(30),
            'total_repaid' => 8250,
            'outstanding_balance' => 0,
            'currency' => 'USDC',
            'escrow_address' => Str::random(43),
            'disbursement_tx_hash' => Str::random(87),
            'repayment_tx_hash' => Str::random(87),
            'approved_at' => Carbon::today()->subDays(180),
            'disbursed_at' => Carbon::today()->subDays(180),
            'repaid_at' => Carbon::today()->subDays(30),
        ]);

        // ---- Asset B: Patek Calatrava — active loan with 2 parcels paid (test pay flow) ----
        $assetB = Asset::create([
            'user_id' => $user->id,
            'category' => 'watch',
            'brand' => 'Patek Philippe',
            'model' => 'Calatrava 5227G',
            'serial_number' => 'P987654',
            'description' => '5227G, 2021, original box and papers',
            'condition' => 'excellent',
            'estimated_value' => 25000,
            'appraised_value' => 25000,
            'appraiser' => 'Marcelo Coelho',
            'appraisal_date' => Carbon::today()->subDays(20),
            'custody_status' => 'in_custody',
            'custody_received_at' => Carbon::today()->subDays(15),
            'custody_location' => 'Vaulx Vault #001 — São Paulo, SP',
            'nft_mint_address' => Str::random(43),
            'metadata_uri' => 'https://arweave.net/' . Str::random(43),
            'mint_tx_hash' => Str::random(87),
        ]);

        $loanB = Loan::create([
            'code' => Loan::generateCode(),
            'user_id' => $user->id,
            'asset_id' => $assetB->id,
            'approved_by' => 1,
            'status' => 'active',
            'asset_value' => 25000,
            'ltv_percent' => 50,
            'principal' => 12500,
            'interest_rate' => 24.00,
            'origination_fee_percent' => 2.50,
            'origination_fee' => 312.50,
            'term_months' => 12,
            'start_date' => Carbon::today()->subDays(15),
            'due_date' => Carbon::today()->addMonths(12)->subDays(15),
            'total_repaid' => 0,
            'outstanding_balance' => 12500,
            'currency' => 'USDC',
            'escrow_address' => Str::random(43),
            'disbursement_tx_hash' => Str::random(87),
            'approved_at' => Carbon::today()->subDays(15),
            'disbursed_at' => Carbon::today()->subDays(15),
        ]);
        $loanB->generateInstallments();

        // ---- Asset C: Cartier Tank — pending evaluation (test evaluator queue) ----
        Asset::create([
            'user_id' => $user->id,
            'category' => 'watch',
            'brand' => 'Cartier',
            'model' => 'Tank Louis',
            'serial_number' => 'C112233',
            'description' => 'Tank Louis Cartier 18k gold, 2019',
            'condition' => 'good',
            'estimated_value' => 8000,
            'custody_status' => 'pending_evaluation',
            'nft_mint_address' => Str::random(43),
            'metadata_uri' => 'https://arweave.net/' . Str::random(43),
            'mint_tx_hash' => Str::random(87),
        ]);

        // ---- Assets D–H: 5 evaluated assets, no loans yet (first-time loan flow) ----
        $firstTimeAssets = [
            [
                'category' => 'watch',
                'brand' => 'Audemars Piguet',
                'model' => 'Royal Oak 15500ST',
                'serial' => 'AP15500',
                'description' => 'Royal Oak Selfwinding 41mm, blue dial, 2022',
                'condition' => 'excellent',
                'value' => 35000,
            ],
            [
                'category' => 'watch',
                'brand' => 'Omega',
                'model' => 'Speedmaster Moonwatch',
                'serial' => 'OMS3110',
                'description' => 'Speedmaster Professional Moonwatch, hesalite, 2021',
                'condition' => 'excellent',
                'value' => 7000,
            ],
            [
                'category' => 'watch',
                'brand' => 'IWC',
                'model' => 'Portugieser Chronograph',
                'serial' => 'IWP3716',
                'description' => 'Portugieser Chronograph 41mm, silver dial, 2020',
                'condition' => 'excellent',
                'value' => 12000,
            ],
            [
                'category' => 'jewelry',
                'brand' => 'Tiffany & Co.',
                'model' => 'Diamond Solitaire 3ct',
                'serial' => 'TIF3CT',
                'description' => '3-carat round brilliant diamond, platinum setting, GIA certified',
                'condition' => 'excellent',
                'value' => 30000,
            ],
            [
                'category' => 'art',
                'brand' => 'Picasso',
                'model' => 'Lithograph signed',
                'serial' => 'PIC1962',
                'description' => 'Pablo Picasso lithograph 1962, signed, certificate of authenticity',
                'condition' => 'excellent',
                'value' => 18000,
            ],
        ];

        foreach ($firstTimeAssets as $i => $a) {
            Asset::create([
                'user_id' => $user->id,
                'category' => $a['category'],
                'brand' => $a['brand'],
                'model' => $a['model'],
                'serial_number' => $a['serial'],
                'description' => $a['description'],
                'condition' => $a['condition'],
                'estimated_value' => $a['value'],
                'appraised_value' => $a['value'],
                'appraiser' => 'Marcelo Coelho',
                'appraisal_date' => Carbon::today()->subDays(10 + $i * 2),
                'custody_status' => 'evaluated',
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
            ]);
        }

        $this->command->info("Test fixture seeded for {$user->email}:");
        $this->command->info("  Asset A · Rolex Submariner · appraised \$15k · repaid loan 30d ago → re-loan ready + reengagement window");
        $this->command->info("  Asset B · Patek Calatrava · appraised \$25k · active loan with 12 installments → test payment flow");
        $this->command->info("  Asset C · Cartier Tank · pending_evaluation → test evaluator queue");
        $this->command->info("  Assets D–H · 5 evaluated assets (AP \$35k · Omega \$7k · IWC \$12k · Tiffany \$30k · Picasso \$18k) → first-time loan flow");
    }
}
