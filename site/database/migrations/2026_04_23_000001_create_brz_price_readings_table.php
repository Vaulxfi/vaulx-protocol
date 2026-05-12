<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('brz_price_readings', function (Blueprint $table) {
            $table->id();
            $table->decimal('brz_usd', 12, 6);
            $table->decimal('usd_brl', 10, 4);
            $table->decimal('brz_brl', 10, 6);
            $table->decimal('depeg_pct', 6, 4);
            $table->string('tier', 20)->default('normal');
            $table->timestamp('read_at')->useCurrent();
            $table->index('read_at');
            $table->index('tier');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brz_price_readings');
    }
};
