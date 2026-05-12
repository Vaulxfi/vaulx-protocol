<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Evaluation;
use App\Models\EvaluatorReport;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Demo borrowers populating the platform with realistic users at every stage
 * of the journey. Built for showroom demos (Colosseum, partners, investors)
 * where stakeholders log in as different personas and see the system live.
 *
 * 10 demo users — 8 happy-path stages + 2 exception states. Each persona has
 * a Brazilian name, an email under @vaulx-demo.fi (so they're easy to spot
 * and wipe), photo URLs from Unsplash, and timestamps that read naturally
 * (registered N days ago, last installment paid Y days ago).
 *
 * Re-running is safe: the seeder force-deletes every user under the
 * @vaulx-demo.fi domain and all their dependent rows before recreating.
 *
 *   php artisan db:seed --class=DemoBorrowersSeeder --force
 *
 * Login for any persona: email below + password "demo123".
 */
class DemoBorrowersSeeder extends Seeder
{
    private const DOMAIN = '@vaulx-demo.fi';
    private const PASSWORD = 'demo123';

    /** Mixkit free demo MP4 — short Rolex on jewellery box clip (10s) */
    private const SAMPLE_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-rolex-vintage-watch-on-a-jewelry-box-19324-large.mp4';

    /**
     * Stable Unsplash photo IDs for each asset category. Prefixed with the
     * canonical width param so they CDN-cache nicely and don't bloat the page.
     */
    private const PHOTOS = [
        'rolex' => [
            'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=1200&auto=format&fit=crop',
        ],
        'patek' => [
            'https://images.unsplash.com/photo-1606293459187-b48a44086929?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1639037687665-37e4f4441045?w=1200&auto=format&fit=crop',
        ],
        'ap' => [
            'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1639037687537-a3a9bf3a82a1?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1664286074240-d7059e004196?w=1200&auto=format&fit=crop',
        ],
        'cartier' => [
            'https://images.unsplash.com/photo-1639037687504-13eb1d8d59b7?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=1200&auto=format&fit=crop',
        ],
        'omega' => [
            'https://images.unsplash.com/photo-1532667449560-72a95c8d381b?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1606293459187-b48a44086929?w=1200&auto=format&fit=crop',
        ],
        'iwc' => [
            'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1606293459339-d3a8a3a7e8f6?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200&auto=format&fit=crop',
        ],
        'tiffany' => [
            'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=1200&auto=format&fit=crop',
        ],
        'picasso' => [
            'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=1200&auto=format&fit=crop',
        ],
    ];

    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $online = User::where('role', 'evaluator_online')->first();
        $offline = User::where('role', 'evaluator_offline')->first();

        if (!$admin || !$online || !$offline) {
            $this->command->error('Required dev users missing — run DevUsersSeeder first.');
            return;
        }

        // ---- Wipe previous demo data --------------------------------------
        $oldDemoUsers = User::where('email', 'like', '%' . self::DOMAIN)->get();
        foreach ($oldDemoUsers as $u) {
            EvaluatorReport::whereHas('evaluation.asset', fn ($q) => $q->where('user_id', $u->id))->forceDelete();
            Evaluation::whereHas('asset', fn ($q) => $q->where('user_id', $u->id))->delete();
            LoanPayment::whereHas('loan', fn ($q) => $q->where('user_id', $u->id))->forceDelete();
            Loan::where('user_id', $u->id)->forceDelete();
            Asset::where('user_id', $u->id)->forceDelete();
            $u->forceDelete();
        }

        DB::transaction(function () use ($admin, $online, $offline) {
            // ============================================================
            // 1. Marina Souza — JUST SUBMITTED (pending evaluation)
            // ============================================================
            $u1 = $this->makeUser('marina.souza', 'Marina Souza');
            Asset::create([
                'user_id' => $u1->id,
                'category' => 'watch', 'brand' => 'Rolex', 'model' => 'Submariner',
                'reference_number' => '126610LN', 'serial_number' => 'Z123ABC',
                'description' => '126610LN, 2022, full set, mint condition. Stainless steel, black ceramic bezel, 41mm.',
                'condition' => 'excellent', 'estimated_value' => 20000,
                'custody_status' => 'pending_evaluation',
                'photo_urls' => self::PHOTOS['rolex'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subHours(4),
                'updated_at' => Carbon::now()->subHours(4),
            ]);

            // ============================================================
            // 2. Pedro Almeida — ONLINE EVAL IN PROGRESS (claimed by online evaluator)
            // ============================================================
            $u2 = $this->makeUser('pedro.almeida', 'Pedro Almeida');
            $a2 = Asset::create([
                'user_id' => $u2->id,
                'category' => 'watch', 'brand' => 'Patek Philippe', 'model' => 'Nautilus 5711/1A',
                'reference_number' => '5711/1A-010', 'serial_number' => 'PP571189',
                'description' => 'Nautilus 5711/1A-010, blue dial, 2020. Stainless steel, full set with international warranty.',
                'condition' => 'excellent', 'estimated_value' => 85000,
                'custody_status' => 'pending_evaluation',
                'photo_urls' => self::PHOTOS['patek'],
                'video_url' => self::SAMPLE_VIDEO,
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subDays(2),
            ]);
            Evaluation::create([
                'asset_id' => $a2->id,
                'online_evaluator_id' => $online->id,
                'status' => Evaluation::STATUS_PENDING_ONLINE,
                'created_at' => Carbon::now()->subDays(2),
            ]);

            // ============================================================
            // 3. Carolina Ribeiro — DECISION TIME (range ready, owner deciding)
            // ============================================================
            $u3 = $this->makeUser('carolina.ribeiro', 'Carolina Ribeiro');
            $a3 = Asset::create([
                'user_id' => $u3->id,
                'category' => 'watch', 'brand' => 'Audemars Piguet', 'model' => 'Royal Oak 15500ST',
                'reference_number' => '15500ST.OO.1220ST.01', 'serial_number' => 'AP15500-RB',
                'description' => 'Royal Oak Selfwinding 41mm, blue dial, 2022. Full set, original box and papers.',
                'condition' => 'excellent', 'estimated_value' => 35000,
                'appraised_value' => 35000, 'appraiser' => 'Online Eva',
                'appraisal_date' => Carbon::today()->subHours(12),
                'custody_status' => 'pending_evaluation',
                'photo_urls' => self::PHOTOS['ap'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subDays(4),
            ]);
            $eval3 = Evaluation::create([
                'asset_id' => $a3->id,
                'online_evaluator_id' => $online->id,
                'status' => Evaluation::STATUS_PENDING_OWNER,
                'range_min' => 33000, 'range_max' => 37000,
                'created_at' => Carbon::now()->subDays(4),
            ]);
            EvaluatorReport::create([
                'evaluation_id' => $eval3->id,
                'evaluator_id' => $online->id,
                'layer' => 'online',
                'value_usd' => 35000, 'grade' => 'ex',
                'has_box' => true, 'has_papers' => true,
                'visual_condition' => ['dial' => 'mint', 'case' => 'ex', 'bracelet' => 'ex', 'glass' => 'mint', 'crown' => 'ex'],
                'replica_signs' => false,
                'submitted_at' => Carbon::now()->subHours(12),
            ]);

            // ============================================================
            // 4. Lucas Ferreira — OFFLINE EVAL IN PROGRESS (owner advanced, offline working)
            // ============================================================
            $u4 = $this->makeUser('lucas.ferreira', 'Lucas Ferreira');
            $a4 = Asset::create([
                'user_id' => $u4->id,
                'category' => 'watch', 'brand' => 'Cartier', 'model' => 'Santos Large',
                'reference_number' => 'WSSA0018', 'serial_number' => 'CRT112233',
                'description' => 'Santos de Cartier Large model, steel/yellow gold, 2021. Original strap and box.',
                'condition' => 'excellent', 'estimated_value' => 14000,
                'appraised_value' => 14000, 'appraiser' => 'Online Eva',
                'appraisal_date' => Carbon::today()->subDays(3),
                'custody_status' => 'pending_evaluation',
                'photo_urls' => self::PHOTOS['cartier'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subDays(7),
            ]);
            $eval4 = Evaluation::create([
                'asset_id' => $a4->id,
                'online_evaluator_id' => $online->id,
                'offline_evaluator_id' => $offline->id,
                'status' => Evaluation::STATUS_PENDING_OFFLINE,
                'range_min' => 13500, 'range_max' => 14500,
                'owner_decision' => true,
                'owner_decided_at' => Carbon::now()->subDays(3)->addHours(8),
                'created_at' => Carbon::now()->subDays(7),
            ]);
            EvaluatorReport::create([
                'evaluation_id' => $eval4->id,
                'evaluator_id' => $online->id,
                'layer' => 'online',
                'value_usd' => 14000, 'grade' => 'ex',
                'has_box' => true, 'has_papers' => true,
                'visual_condition' => ['dial' => 'mint', 'case' => 'ex', 'bracelet' => 'ex', 'glass' => 'mint', 'crown' => 'ex'],
                'replica_signs' => false,
                'submitted_at' => Carbon::now()->subDays(4),
            ]);

            // ============================================================
            // 5. Ana Castro — PENDING CUSTODY (loan approved, asset shipping)
            // ============================================================
            $u5 = $this->makeUser('ana.castro', 'Ana Castro');
            $a5 = Asset::create([
                'user_id' => $u5->id,
                'category' => 'jewelry', 'brand' => 'Tiffany & Co.', 'model' => 'Diamond Solitaire 3ct',
                'reference_number' => 'TIF-3CT-PT', 'serial_number' => 'TIF3CT-AC',
                'description' => '3-carat round brilliant diamond, platinum setting, GIA certified VVS1, F color.',
                'condition' => 'excellent', 'estimated_value' => 30000,
                'appraised_value' => 30000, 'appraiser' => 'Online Eva + Offline Oscar',
                'appraisal_date' => Carbon::today()->subDays(8),
                'custody_status' => 'evaluated',
                'photo_urls' => self::PHOTOS['tiffany'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subDays(14),
            ]);
            Loan::create([
                'code' => 'GF-DEMO-'.Str::upper(Str::random(6)),
                'user_id' => $u5->id, 'asset_id' => $a5->id, 'approved_by' => $admin->id,
                'status' => 'pending_custody',
                'asset_value' => 30000, 'ltv_percent' => 50, 'principal' => 15000,
                'interest_rate' => 24.00, 'origination_fee_percent' => 2.50, 'origination_fee' => 375,
                'term_months' => 12,
                'start_date' => Carbon::today(), 'due_date' => Carbon::today()->addMonths(12),
                'total_repaid' => 0, 'outstanding_balance' => 15000, 'currency' => 'USDC',
                'escrow_address' => Str::random(43),
                'approved_at' => Carbon::now()->subDays(2),
                'created_at' => Carbon::now()->subDays(2),
            ]);

            // ============================================================
            // 6. Felipe Martins — ACTIVE LOAN, 1 of 12 paid (recent)
            // ============================================================
            $u6 = $this->makeUser('felipe.martins', 'Felipe Martins');
            $a6 = Asset::create([
                'user_id' => $u6->id,
                'category' => 'watch', 'brand' => 'Rolex', 'model' => 'GMT-Master II',
                'reference_number' => '126710BLNR', 'serial_number' => 'RLX-GMT-FM',
                'description' => 'GMT-Master II "Batman", blue/black ceramic bezel, 2021. Full set.',
                'condition' => 'excellent', 'estimated_value' => 25000,
                'appraised_value' => 25000, 'appraiser' => 'Marcelo Coelho',
                'appraisal_date' => Carbon::today()->subDays(40),
                'custody_status' => 'in_custody',
                'custody_received_at' => Carbon::today()->subDays(35),
                'custody_location' => 'Vaulx Vault #001 — São Paulo, SP',
                'photo_urls' => self::PHOTOS['rolex'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subDays(45),
            ]);
            $loan6 = Loan::create([
                'code' => 'GF-DEMO-'.Str::upper(Str::random(6)),
                'user_id' => $u6->id, 'asset_id' => $a6->id, 'approved_by' => $admin->id,
                'status' => 'active',
                'asset_value' => 25000, 'ltv_percent' => 50, 'principal' => 12500,
                'interest_rate' => 24.00, 'origination_fee_percent' => 2.50, 'origination_fee' => 312.50,
                'term_months' => 12,
                'start_date' => Carbon::today()->subDays(35), 'due_date' => Carbon::today()->addMonths(11)->subDays(5),
                'total_repaid' => 1294.79, 'outstanding_balance' => 11250,
                'currency' => 'USDC',
                'escrow_address' => Str::random(43),
                'disbursement_tx_hash' => Str::random(87),
                'approved_at' => Carbon::now()->subDays(36),
                'disbursed_at' => Carbon::now()->subDays(35),
                'created_at' => Carbon::now()->subDays(36),
            ]);
            $this->generateInstallments($loan6, 1);

            // ============================================================
            // 7. Beatriz Lima — ACTIVE LOAN, 8 of 12 paid (almost done)
            // ============================================================
            $u7 = $this->makeUser('beatriz.lima', 'Beatriz Lima');
            $a7 = Asset::create([
                'user_id' => $u7->id,
                'category' => 'art', 'brand' => 'Picasso', 'model' => 'Lithograph signed',
                'reference_number' => 'PIC-1962-LITH', 'serial_number' => 'PIC1962-BL',
                'description' => 'Pablo Picasso lithograph 1962, signed, edition of 50, certificate of authenticity.',
                'condition' => 'excellent', 'estimated_value' => 18000,
                'appraised_value' => 18000, 'appraiser' => 'Marcelo Coelho',
                'appraisal_date' => Carbon::today()->subMonths(8),
                'custody_status' => 'in_custody',
                'custody_received_at' => Carbon::today()->subMonths(8)->subDays(2),
                'custody_location' => 'Vaulx Vault #001 — São Paulo, SP',
                'photo_urls' => self::PHOTOS['picasso'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subMonths(8)->subDays(5),
            ]);
            $loan7 = Loan::create([
                'code' => 'GF-DEMO-'.Str::upper(Str::random(6)),
                'user_id' => $u7->id, 'asset_id' => $a7->id, 'approved_by' => $admin->id,
                'status' => 'active',
                'asset_value' => 18000, 'ltv_percent' => 50, 'principal' => 9000,
                'interest_rate' => 24.00, 'origination_fee_percent' => 2.50, 'origination_fee' => 225,
                'term_months' => 12,
                'start_date' => Carbon::today()->subMonths(8), 'due_date' => Carbon::today()->addMonths(4),
                'total_repaid' => 7460.13, 'outstanding_balance' => 3000,
                'currency' => 'USDC',
                'escrow_address' => Str::random(43),
                'disbursement_tx_hash' => Str::random(87),
                'approved_at' => Carbon::now()->subMonths(8)->addDays(1),
                'disbursed_at' => Carbon::now()->subMonths(8),
                'created_at' => Carbon::now()->subMonths(8)->subDays(1),
            ]);
            $this->generateInstallments($loan7, 8);

            // ============================================================
            // 8. Rafael Costa — REPAID, ready for re-loan
            // ============================================================
            $u8 = $this->makeUser('rafael.costa', 'Rafael Costa');
            $a8 = Asset::create([
                'user_id' => $u8->id,
                'category' => 'watch', 'brand' => 'Patek Philippe', 'model' => 'Calatrava 5227G',
                'reference_number' => '5227G-001', 'serial_number' => 'PP5227-RC',
                'description' => 'Calatrava 5227G, white gold, 2020. Original box and papers, mint condition.',
                'condition' => 'excellent', 'estimated_value' => 25000,
                'appraised_value' => 25000, 'appraiser' => 'Marcelo Coelho',
                'appraisal_date' => Carbon::today()->subDays(35),
                'custody_status' => 'released',
                'photo_urls' => self::PHOTOS['patek'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subMonths(7),
            ]);
            Loan::create([
                'code' => 'GF-DEMO-'.Str::upper(Str::random(6)),
                'user_id' => $u8->id, 'asset_id' => $a8->id, 'approved_by' => $admin->id,
                'status' => 'repaid',
                'asset_value' => 25000, 'ltv_percent' => 50, 'principal' => 12500,
                'interest_rate' => 24.00, 'origination_fee_percent' => 2.50, 'origination_fee' => 312.50,
                'term_months' => 6,
                'start_date' => Carbon::today()->subMonths(7), 'due_date' => Carbon::today()->subMonths(1),
                'total_repaid' => 12500, 'outstanding_balance' => 0,
                'currency' => 'USDC',
                'escrow_address' => Str::random(43),
                'disbursement_tx_hash' => Str::random(87),
                'repayment_tx_hash' => Str::random(87),
                'approved_at' => Carbon::now()->subMonths(7),
                'disbursed_at' => Carbon::now()->subMonths(7),
                'repaid_at' => Carbon::now()->subDays(30),
                'created_at' => Carbon::now()->subMonths(7),
            ]);

            // ============================================================
            // 9. Daniel Borges — OVERDUE
            // ============================================================
            $u9 = $this->makeUser('daniel.borges', 'Daniel Borges');
            $a9 = Asset::create([
                'user_id' => $u9->id,
                'category' => 'watch', 'brand' => 'IWC', 'model' => 'Portugieser Chronograph',
                'reference_number' => 'IW371605', 'serial_number' => 'IWC-PORT-DB',
                'description' => 'Portugieser Chronograph 41mm, silver dial, 2020. Full set.',
                'condition' => 'good', 'estimated_value' => 12000,
                'appraised_value' => 12000, 'appraiser' => 'Marcelo Coelho',
                'appraisal_date' => Carbon::today()->subDays(120),
                'custody_status' => 'in_custody',
                'custody_received_at' => Carbon::today()->subDays(118),
                'custody_location' => 'Vaulx Vault #001 — São Paulo, SP',
                'photo_urls' => self::PHOTOS['iwc'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subDays(125),
            ]);
            $loan9 = Loan::create([
                'code' => 'GF-DEMO-'.Str::upper(Str::random(6)),
                'user_id' => $u9->id, 'asset_id' => $a9->id, 'approved_by' => $admin->id,
                'status' => 'overdue',
                'asset_value' => 12000, 'ltv_percent' => 50, 'principal' => 6000,
                'interest_rate' => 24.00, 'origination_fee_percent' => 2.50, 'origination_fee' => 150,
                'term_months' => 6,
                'start_date' => Carbon::today()->subDays(110), 'due_date' => Carbon::today()->subDays(8),
                'total_repaid' => 1500, 'outstanding_balance' => 4500,
                'currency' => 'USDC',
                'escrow_address' => Str::random(43),
                'disbursement_tx_hash' => Str::random(87),
                'approved_at' => Carbon::now()->subDays(112),
                'disbursed_at' => Carbon::now()->subDays(110),
                'created_at' => Carbon::now()->subDays(112),
            ]);
            $this->generateInstallments($loan9, 2, overdueInstallment: 3);

            // ============================================================
            // 10. Sophia Reis — DEFAULTED
            // ============================================================
            $u10 = $this->makeUser('sophia.reis', 'Sophia Reis');
            $a10 = Asset::create([
                'user_id' => $u10->id,
                'category' => 'watch', 'brand' => 'Omega', 'model' => 'Speedmaster Moonwatch',
                'reference_number' => '311.30.42.30.01.005', 'serial_number' => 'OMS-SPD-SR',
                'description' => 'Speedmaster Professional Moonwatch, hesalite, 2019. Original box.',
                'condition' => 'good', 'estimated_value' => 7000,
                'appraised_value' => 7000, 'appraiser' => 'Marcelo Coelho',
                'appraisal_date' => Carbon::today()->subMonths(10),
                'custody_status' => 'in_custody',
                'custody_received_at' => Carbon::today()->subMonths(10),
                'custody_location' => 'Vaulx Recovery — São Paulo, SP',
                'photo_urls' => self::PHOTOS['omega'],
                'nft_mint_address' => Str::random(43),
                'metadata_uri' => 'https://arweave.net/' . Str::random(43),
                'mint_tx_hash' => Str::random(87),
                'created_at' => Carbon::now()->subMonths(11),
            ]);
            Loan::create([
                'code' => 'GF-DEMO-'.Str::upper(Str::random(6)),
                'user_id' => $u10->id, 'asset_id' => $a10->id, 'approved_by' => $admin->id,
                'status' => 'defaulted',
                'asset_value' => 7000, 'ltv_percent' => 50, 'principal' => 3500,
                'interest_rate' => 24.00, 'origination_fee_percent' => 2.50, 'origination_fee' => 87.50,
                'term_months' => 6,
                'start_date' => Carbon::today()->subMonths(9), 'due_date' => Carbon::today()->subMonths(3),
                'total_repaid' => 500, 'outstanding_balance' => 3000,
                'currency' => 'USDC',
                'escrow_address' => Str::random(43),
                'disbursement_tx_hash' => Str::random(87),
                'approved_at' => Carbon::now()->subMonths(9),
                'disbursed_at' => Carbon::now()->subMonths(9),
                'defaulted_at' => Carbon::now()->subMonths(2),
                'admin_notes' => 'Auto-defaulted after 60 days overdue. Recovery in progress.',
                'created_at' => Carbon::now()->subMonths(9),
            ]);
        });

        $this->command->info('Demo borrowers seeded — 10 personas, login with password "demo123":');
        $this->command->info('  1. marina.souza@vaulx-demo.fi   · Just submitted (pending eval)');
        $this->command->info('  2. pedro.almeida@vaulx-demo.fi  · Online eval in progress');
        $this->command->info('  3. carolina.ribeiro@vaulx-demo.fi · Decision time (range ready)');
        $this->command->info('  4. lucas.ferreira@vaulx-demo.fi · Offline eval in progress');
        $this->command->info('  5. ana.castro@vaulx-demo.fi     · Pending custody (loan approved)');
        $this->command->info('  6. felipe.martins@vaulx-demo.fi · Active loan, 1 of 12 paid');
        $this->command->info('  7. beatriz.lima@vaulx-demo.fi   · Active loan, 8 of 12 paid');
        $this->command->info('  8. rafael.costa@vaulx-demo.fi   · Repaid, ready for re-loan');
        $this->command->info('  9. daniel.borges@vaulx-demo.fi  · Overdue (1 installment 8 days late)');
        $this->command->info(' 10. sophia.reis@vaulx-demo.fi    · Defaulted (recovery)');
    }

    protected function makeUser(string $localPart, string $name): User
    {
        return User::create([
            'name' => $name,
            'email' => $localPart . self::DOMAIN,
            'password' => Hash::make(self::PASSWORD),
            'role' => 'borrower',
            'auth_provider' => 'email',
        ]);
    }

    /**
     * Generate `term_months` installments for a loan, marking the first
     * `paidCount` as paid (with paid_at backdated to their due_date).
     * If `overdueInstallment` is given, that installment number is left
     * unpaid with a past due_date (used for the overdue persona).
     */
    protected function generateInstallments(Loan $loan, int $paidCount, ?int $overdueInstallment = null): void
    {
        $months = (int) $loan->term_months;
        $monthlyAmount = round(((float) $loan->principal * (1 + 0.24 * $months / 12)) / $months, 2);
        $monthlyPrincipal = round((float) $loan->principal / $months, 2);
        $monthlyInterest = round($monthlyAmount - $monthlyPrincipal, 2);
        $start = Carbon::parse($loan->start_date);

        for ($i = 1; $i <= $months; $i++) {
            $due = $start->copy()->addMonths($i);
            $isPaid = $i <= $paidCount;
            LoanPayment::create([
                'loan_id' => $loan->id,
                'installment_number' => $i,
                'amount_due' => $monthlyAmount,
                'principal_portion' => $monthlyPrincipal,
                'interest_portion' => $monthlyInterest,
                'due_date' => $due,
                'paid_at' => $isPaid ? $due : null,
                'amount_paid' => $isPaid ? $monthlyAmount : 0,
            ]);
        }
    }
}
