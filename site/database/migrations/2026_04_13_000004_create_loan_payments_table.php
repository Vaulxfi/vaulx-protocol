<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLoanPaymentsTable extends Migration
{
    public function up()
    {
        Schema::create('loan_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');

            $table->integer('installment_number');
            $table->decimal('amount_due', 15, 2);
            $table->decimal('principal_portion', 15, 2);
            $table->decimal('interest_portion', 15, 2);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->date('due_date');
            $table->date('paid_at')->nullable();

            $table->enum('status', ['pending', 'paid', 'overdue', 'partial'])->default('pending');

            // Solana (Devnet Demo)
            $table->string('tx_hash', 88)->nullable();

            $table->timestamps();

            $table->index(['loan_id', 'status']);
            $table->index('due_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('loan_payments');
    }
}
