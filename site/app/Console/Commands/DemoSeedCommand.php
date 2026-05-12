<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Asset;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * `php artisan demo:seed`
 *
 * Idempotent demo bootstrap for the magic-link onboarding flow. Wipes
 * anything previously planted under the demo emails (and the vanity IDs
 * 47), then re-creates:
 *
 *   User  · demo-borrower@vaulx.fi (role=borrower, magic-link only)
 *   User  · demo-admin@vaulx.fi    (role=admin,    magic-link only)
 *   Asset · id=47 · Rolex Submariner · $15,000 · evaluated  (owned by borrower)
 *   Loan  · id=47 · $8,250 USDC · 6mo · 24% · pending_custody (borrower)
 *
 * The admin user exists so partner demo videos can iframe the admin-side
 * "Approve & Disburse" screen on the same loan — without an admin role,
 * the magic-link session hits the `admin` middleware and bounces with 403.
 *
 * Asset and Loan use forced primary keys (47) because the magic-link
 * URLs reference them directly. To avoid clobbering production rows that
 * happen to live at id=47, the wipe is conditional: we hard-delete id=47
 * only if it has no `user_id` other than one of the demo users. If id=47
 * belongs to anyone else, the command aborts with a clear error.
 *
 * Hard-deletes (DB::table) bypass SoftDeletes — necessary because forcing
 * the same primary key would collide with a tombstoned row otherwise.
 *
 * Re-run safe: invoking the command twice produces the same final state.
 */
class DemoSeedCommand extends Command
{
    protected $signature = 'demo:seed';

    protected $description = 'Idempotent demo seed (demo-borrower + demo-admin + asset 47 + loan 47).';

    private const DEMO_BORROWER_EMAIL = 'demo-borrower@vaulx.fi';
    private const DEMO_ADMIN_EMAIL = 'demo-admin@vaulx.fi';
    private const DEMO_ASSET_ID = 47;
    private const DEMO_LOAN_ID = 47;

    public function handle(): int
    {
        $this->info('Seeding demo state…');

        DB::transaction(function (): void {
            $existingBorrower = User::where('email', self::DEMO_BORROWER_EMAIL)->first();
            $existingAdmin = User::where('email', self::DEMO_ADMIN_EMAIL)->first();
            $demoUserIds = array_filter([$existingBorrower?->id, $existingAdmin?->id]);

            $this->guardForeignAssetCollision($demoUserIds);
            $this->guardForeignLoanCollision($demoUserIds);

            $this->wipeDemoState($demoUserIds);

            $borrower = $this->createUser(self::DEMO_BORROWER_EMAIL, 'Demo Borrower', 'borrower');
            $admin = $this->createUser(self::DEMO_ADMIN_EMAIL, 'Demo Admin', 'admin');
            $asset = $this->createAsset($borrower->id);
            $loan = $this->createLoan($borrower->id, $asset->id);

            $this->info("✓ User  #{$borrower->id}  ".$borrower->email."  (borrower)");
            $this->info("✓ User  #{$admin->id}  ".$admin->email."  (admin)");
            $this->info("✓ Asset #{$asset->id}  {$asset->brand} {$asset->model}  appraised \${$asset->appraised_value}");
            $this->info("✓ Loan  #{$loan->id}  {$loan->code}  \${$loan->principal} {$loan->currency}  status={$loan->status}");
        });

        $this->info('Done.');
        return self::SUCCESS;
    }

    /**
     * Refuse to run if asset id=47 exists with a user_id we don't recognise
     * (i.e. not one of the demo users). Returns silently otherwise.
     *
     * @param  list<int>  $demoUserIds
     */
    private function guardForeignAssetCollision(array $demoUserIds): void
    {
        $owner = DB::table('assets')->where('id', self::DEMO_ASSET_ID)->value('user_id');
        if ($owner !== null && ! in_array($owner, $demoUserIds, true)) {
            $this->error("Asset id=".self::DEMO_ASSET_ID." already belongs to user_id={$owner} (not a demo user). Aborting.");
            throw new \RuntimeException('demo seed aborted: foreign asset id collision');
        }
    }

    /** @param  list<int>  $demoUserIds */
    private function guardForeignLoanCollision(array $demoUserIds): void
    {
        $owner = DB::table('loans')->where('id', self::DEMO_LOAN_ID)->value('user_id');
        if ($owner !== null && ! in_array($owner, $demoUserIds, true)) {
            $this->error("Loan id=".self::DEMO_LOAN_ID." already belongs to user_id={$owner} (not a demo user). Aborting.");
            throw new \RuntimeException('demo seed aborted: foreign loan id collision');
        }
    }

    /**
     * Tear down anything left behind by previous runs. Order matters because
     * of FK constraints (payments → loans → assets → user).
     *
     * @param  list<int>  $demoUserIds
     */
    private function wipeDemoState(array $demoUserIds): void
    {
        if (! empty($demoUserIds)) {
            $loanIds = DB::table('loans')->whereIn('user_id', $demoUserIds)->pluck('id')->all();
            if (! empty($loanIds)) {
                DB::table('loan_payments')->whereIn('loan_id', $loanIds)->delete();
            }
            DB::table('loans')->whereIn('user_id', $demoUserIds)->delete();
            DB::table('assets')->whereIn('user_id', $demoUserIds)->delete();
        }
        // Belt-and-suspenders: the vanity IDs may exist orphaned if a previous
        // run was interrupted between user delete and asset/loan delete.
        DB::table('loan_payments')->where('loan_id', self::DEMO_LOAN_ID)->delete();
        DB::table('loans')->where('id', self::DEMO_LOAN_ID)->delete();
        DB::table('assets')->where('id', self::DEMO_ASSET_ID)->delete();

        if (! empty($demoUserIds)) {
            DB::table('users')->whereIn('id', $demoUserIds)->delete();
        }
    }

    private function createUser(string $email, string $name, string $role): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            // Random 64-byte password: there's no password-login path for the
            // demo users — magic link is the only way in. We still need a
            // valid hash so Laravel's auth scaffolding doesn't choke.
            'password' => Hash::make(Str::random(64)),
            'role' => $role,
            'is_active' => true,
        ]);
    }

    private function createAsset(int $userId): Asset
    {
        $asset = new Asset([
            'user_id' => $userId,
            'category' => 'watch',
            'brand' => 'Rolex',
            'model' => 'Submariner',
            'description' => 'Demo Rolex Submariner — magic-link onboarding scenario',
            'condition' => 'excellent',
            'estimated_value' => 15000,
            'appraised_value' => 15000,
            'appraiser' => 'Demo Appraiser',
            'appraisal_date' => Carbon::now()->subDays(2),
            'custody_status' => 'evaluated',
            'custody_location' => 'Vaulx Vault #001 — São Paulo, SP',
            'photo_urls' => [
                'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200&auto=format&fit=crop',
            ],
        ]);
        $asset->id = self::DEMO_ASSET_ID;
        $asset->save();

        return $asset->fresh();
    }

    private function createLoan(int $userId, int $assetId): Loan
    {
        $principal = 8250.00;
        $assetValue = 15000.00;

        $loan = new Loan([
            'code' => 'GF-DEMO-00047',
            'user_id' => $userId,
            'asset_id' => $assetId,
            'status' => 'pending_custody',
            'asset_value' => $assetValue,
            'ltv_percent' => round($principal / $assetValue * 100, 2), // 55.00
            'principal' => $principal,
            'interest_rate' => 24,
            'origination_fee_percent' => 2.5,
            'origination_fee' => round($principal * 0.025, 2), // 206.25
            'liquidation_fee_percent' => 1.5,
            'term_months' => 6,
            'currency' => 'USDC',
            'outstanding_balance' => $principal,
            'total_repaid' => 0,
        ]);
        $loan->id = self::DEMO_LOAN_ID;
        $loan->save();

        return $loan->fresh();
    }
}
