<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add the on-chain identity fields the Laravel side needs to talk to the
 * Solana bridge.
 *
 * `solana_loan_id` — base58 32-byte pubkey identifying the loan on-chain.
 * Bridge endpoints take this as `loanId` and derive `loan_config` /
 * `trdc_state` PDAs from it. While the bridge is in placeholder mode the
 * Laravel side can backfill a deterministic stable pubkey on first use
 * (see Loan::getSolanaLoanIdAttribute); when the atomic confirm-custody
 * PR ships and loans are minted on-chain at create-time, this column will
 * hold the real PDA.
 *
 * `confirm_custody_tx` — the txSignature returned by the bridge after a
 * successful `confirmCustodyAndDisburse` call. Distinct from the legacy
 * `disbursement_tx_hash` which was a Str::random() mock; we'd rather add a
 * cleanly-named field than overload the legacy one with split semantics.
 */
class AddSolanaFieldsToLoansTable extends Migration
{
    public function up()
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->string('solana_loan_id', 64)->nullable()->after('escrow_address');
            $table->string('confirm_custody_tx', 128)->nullable()->after('disbursement_tx_hash');

            // Lookup-by-pubkey is how the webhook-listener side will route
            // on-chain events back to a Laravel loan. Index now to avoid a
            // schema change later when that path lights up.
            $table->index('solana_loan_id');
        });
    }

    public function down()
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex(['solana_loan_id']);
            $table->dropColumn(['solana_loan_id', 'confirm_custody_tx']);
        });
    }
}
