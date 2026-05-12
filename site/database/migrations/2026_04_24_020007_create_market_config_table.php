<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('market_config', function (Blueprint $table) {
            $table->id();
            $table->string('brand', 64);
            $table->string('family', 64)->nullable();
            $table->decimal('brl_factor', 6, 4)->default(1.0);
            $table->string('notes')->nullable();
            $table->timestamps();
            $table->unique(['brand', 'family']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_config');
    }
};
