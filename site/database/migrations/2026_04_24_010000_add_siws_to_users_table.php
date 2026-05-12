<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('solana_pubkey', 44)->nullable()->unique()->after('wallet_address');
            $table->string('auth_provider', 16)->default('email')->after('solana_pubkey');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['solana_pubkey']);
            $table->dropColumn(['solana_pubkey', 'auth_provider']);
        });
    }
};
