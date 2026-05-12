<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Evaluation;
use App\Models\EvaluatorReport;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * End-to-end production test fixture.
 *
 * Sister of TestFixtureSeeder but for the *prod* DB. Idempotent: wipes
 * fixtures for the four target accounts on every run, then re-creates them.
 *
 * Reads target emails from environment variables, with sensible defaults
 * matching the accounts already registered on vaulx.fi:
 *
 *   VX_BORROWER_EMAIL  (default: tester+1777319895@vaulx.fi)
 *   VX_ONLINE_EMAIL    (default: online-vx-1777320556@vaulx.fi)
 *   VX_OFFLINE_EMAIL   (default: offline-vx-1777320556@vaulx.fi)
 *   VX_ADMIN_EMAIL     (default: admin-vx-1777320556@vaulx.fi)
 *
 * Run with:
 *   php artisan db:seed --class=ProdFixtureSeeder --force
 */
class ProdFixtureSeeder extends Seeder
{
    public function run(): void
    {
        $borrowerEmail = env('VX_BORROWER_EMAIL', 'tester+1777319895@vaulx.fi');
        $onlineEmail = env('VX_ONLINE_EMAIL', 'online-vx-1777320556@vaulx.fi');
        $offlineEmail = env('VX_OFFLINE_EMAIL', 'offline-vx-1777320556@vaulx.fi');
        $adminEmail = env('VX_ADMIN_EMAIL', 'admin-vx-1777320556@vaulx.fi');

        $borrower = User::where('email', $borrowerEmail)->first();
        $online = User::where('email', $onlineEmail)->first();
        $offline = User::where('email', $offlineEmail)->first();
        $admin = User::where('email', $adminEmail)->first();

        $missing = [];
        if (!$borrower) $missing[] = "borrower={$borrowerEmail}";
        if (!$online) $missing[] = "online={$onlineEmail}";
        if (!$offline) $missing[] = "offline={$offlineEmail}";
        if (!$admin) $missing[] = "admin={$adminEmail}";
        if ($missing) {
            $this->command->error('Missing required users: ' . implode(', ', $missing));
            $this->command->warn('Register them via /register first, then re-run this seeder.');
            return;
        }

        $approverId = $admin->id;

        DB::transaction(function () use ($borrower, $online, $offline, $approverId) {
            // ---- WIPE ----
            // Delete reports → evaluations → loans → assets, then NULL out market snapshots
            // to keep referential integrity even if cascade is missing.
            EvaluatorReport::whereHas('evaluation.asset', fn ($q) => $q->where('user_id', $borrower->id))
                ->forceDelete();
            Evaluation::whereHas('asset', fn ($q) => $q->where('user_id', $borrower->id))->delete();
            Loan::where('user_id', $borrower->id)->forceDelete();
            Asset::where('user_id', $borrower->id)->forceDelete();

            // ---- ASSET A: Rolex Submariner — repaid loan, ready for re-loan + reengagement ----
            $assetA = Asset::create([
                'user_id' => $borrower->id,
                'category' => 'watch',
                'brand' => 'Rolex',
                'model' => 'Submariner',
                'reference_number' => '126610LN',
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

            Loan::create([
                'code' => Loan::generateCode(),
                'user_id' => $borrower->id,
                'asset_id' => $assetA->id,
                'approved_by' => $approverId,
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

            // ---- ASSET B: Patek Calatrava — active loan, 12 installments ----
            $assetB = Asset::create([
                'user_id' => $borrower->id,
                'category' => 'watch',
                'brand' => 'Patek Philippe',
                'model' => 'Calatrava 5227G',
                'reference_number' => '5227G',
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
                'user_id' => $borrower->id,
                'asset_id' => $assetB->id,
                'approved_by' => $approverId,
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

            // ---- ASSET C: Cartier Tank — pending_online evaluation (assigned to online evaluator) ----
            $assetC = Asset::create([
                'user_id' => $borrower->id,
                'category' => 'watch',
                'brand' => 'Cartier',
                'model' => 'Tank Louis',
                'reference_number' => 'W1529756',
                'serial_number' => 'C112233',
                'description' => 'Tank Louis Cartier 18k gold, 2019',
                'condition' => 'good',
                'estimated_value' => 8000,
                'custody_status' => 'pending_evaluation',
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
            ]);
            Evaluation::create([
                'asset_id' => $assetC->id,
                'online_evaluator_id' => $online->id, // pre-assigned so it shows in his queue
                'status' => Evaluation::STATUS_PENDING_ONLINE,
            ]);

            // ---- ASSET D: Audemars Piguet — pending_offline (online done, owner advanced) ----
            $assetD = Asset::create([
                'user_id' => $borrower->id,
                'category' => 'watch',
                'brand' => 'Audemars Piguet',
                'model' => 'Royal Oak 15500ST',
                'reference_number' => '15500ST',
                'serial_number' => 'AP15500',
                'description' => 'Royal Oak Selfwinding 41mm, blue dial, 2022',
                'condition' => 'excellent',
                'estimated_value' => 35000,
                'appraised_value' => 35000,
                'appraiser' => 'Online Eval',
                'appraisal_date' => Carbon::today()->subDays(2),
                'custody_status' => 'pending_evaluation',
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
            ]);
            $evalD = Evaluation::create([
                'asset_id' => $assetD->id,
                'online_evaluator_id' => $online->id,
                'offline_evaluator_id' => $offline->id, // pre-assigned for his queue
                'status' => Evaluation::STATUS_PENDING_OFFLINE,
                'range_min' => 33000,
                'range_max' => 37000,
                'owner_decision' => true,
                'owner_decided_at' => Carbon::now()->subHours(6),
            ]);
            EvaluatorReport::create([
                'evaluation_id' => $evalD->id,
                'evaluator_id' => $online->id,
                'layer' => 'online',
                'value_usd' => 35000,
                'grade' => 'ex',
                'has_box' => true,
                'has_papers' => true,
                'visual_condition' => [
                    'dial' => 'mint', 'case' => 'ex', 'bracelet' => 'ex', 'glass' => 'mint', 'crown' => 'ex',
                ],
                'replica_signs' => false,
                'submitted_at' => Carbon::now()->subHours(8),
            ]);

            // ---- ASSETS E–H: 4 evaluated, no loans (first-time loan flow) ----
            $firstTimeAssets = [
                ['watch', 'Omega', 'Speedmaster Moonwatch', '311.30.42.30.01.005', 'OMS3110',
                    'Speedmaster Professional Moonwatch, hesalite, 2021', 7000],
                ['watch', 'IWC', 'Portugieser Chronograph', 'IW371605', 'IWP3716',
                    'Portugieser Chronograph 41mm, silver dial, 2020', 12000],
                ['jewelry', 'Tiffany & Co.', 'Diamond Solitaire 3ct', 'TIF-3CT-PT', 'TIF3CT',
                    '3-carat round brilliant diamond, platinum setting, GIA certified', 30000],
                ['art', 'Picasso', 'Lithograph signed', 'PIC-1962-LITH', 'PIC1962',
                    'Pablo Picasso lithograph 1962, signed, certificate of authenticity', 18000],
            ];

            foreach ($firstTimeAssets as $i => $a) {
                Asset::create([
                    'user_id' => $borrower->id,
                    'category' => $a[0],
                    'brand' => $a[1],
                    'model' => $a[2],
                    'reference_number' => $a[3],
                    'serial_number' => $a[4],
                    'description' => $a[5],
                    'condition' => 'excellent',
                    'estimated_value' => $a[6],
                    'appraised_value' => $a[6],
                    'appraiser' => 'Marcelo Coelho',
                    'appraisal_date' => Carbon::today()->subDays(10 + $i * 2),
                    'custody_status' => 'evaluated',
                    'nft_mint_address' => Str::random(43),
                    'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                    'mint_tx_hash' => Str::random(87),
                ]);
            }
        });

        $this->command->info("Prod fixture seeded for {$borrower->email}:");
        $this->command->info('  A · Rolex Submariner $15k    · repaid 30d ago        → re-loan + reengagement window');
        $this->command->info('  B · Patek Calatrava $25k     · active, 12 installments → test pay flow');
        $this->command->info("  C · Cartier Tank $8k         · pending_online        → {$online->email}'s queue");
        $this->command->info("  D · Audemars Piguet $35k     · pending_offline       → {$offline->email}'s queue (online + owner done)");
        $this->command->info('  E · Omega Speedmaster $7k    · evaluated             → first-time loan flow');
        $this->command->info('  F · IWC Portugieser $12k     · evaluated             → first-time loan flow');
        $this->command->info('  G · Tiffany 3ct $30k         · evaluated             → first-time loan flow (jewelry)');
        $this->command->info('  H · Picasso lithograph $18k  · evaluated             → first-time loan flow (art)');
    }
}
