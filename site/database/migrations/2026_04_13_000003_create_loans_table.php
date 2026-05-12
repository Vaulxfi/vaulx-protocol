<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLoansTable extends Migration
{
    public function up()
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // GF-2026-00001
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('asset_id')->constrained()->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');

            // Status: PENDING_CUSTODY → ACTIVE → OVERDUE → DEFAULTED → REPAID
            $table->enum('status', [
                'pending_custody',
                'active',
                'overdue',
                'defaulted',
                'repaid',
            ])->default('pending_custody');

            // Valores
            $table->decimal('asset_value', 15, 2);          // valor do ativo na aprovação
            $table->decimal('ltv_percent', 5, 2);            // 50-60%
            $table->decimal('principal', 15, 2);             // valor liberado
            $table->decimal('interest_rate', 5, 2);          // taxa anual %
            $table->decimal('origination_fee_percent', 5, 2)->default(2.50);
            $table->decimal('origination_fee', 15, 2);       // valor absoluto da taxa
            $table->decimal('liquidation_fee_percent', 5, 2)->default(5.00);

            // Prazo
            $table->integer('term_months');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();

            // Saldo
            $table->decimal('total_repaid', 15, 2)->default(0);
            $table->decimal('outstanding_balance', 15, 2)->default(0);

            // Moeda de liberação
            $table->enum('currency', ['USDC', 'BRZ'])->default('USDC');

            // Solana (Devnet Demo - dados mockados)
            $table->string('escrow_address', 44)->nullable();
            $table->string('disbursement_tx_hash', 88)->nullable();
            $table->string('repayment_tx_hash', 88)->nullable();

            // Datas de controle
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->timestamp('repaid_at')->nullable();
            $table->timestamp('defaulted_at')->nullable();

            $table->text('admin_notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
            $table->index('status');
            $table->index('due_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('loans');
    }
}
