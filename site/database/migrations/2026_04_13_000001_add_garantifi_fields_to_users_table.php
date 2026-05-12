<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddGarantifiFieldsToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['borrower', 'admin', 'evaluator_online', 'evaluator_offline'])->default('borrower')->after('email');
            $table->string('cpf_cnpj', 18)->nullable()->unique()->after('role');
            $table->string('phone', 20)->nullable()->after('cpf_cnpj');
            $table->string('wallet_address', 44)->nullable()->after('phone');
            $table->text('address')->nullable()->after('wallet_address');
            $table->boolean('is_active')->default(true)->after('address');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role', 'cpf_cnpj', 'phone',
                'wallet_address', 'address', 'is_active',
            ]);
        });
    }
}
