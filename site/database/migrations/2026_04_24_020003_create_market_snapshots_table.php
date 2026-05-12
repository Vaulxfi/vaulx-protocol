<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('market_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained()->cascadeOnDelete();
            $table->string('reference_number', 64)->index();
            $table->decimal('median_usd', 12, 2);
            $table->decimal('min_usd', 12, 2);
            $table->decimal('max_usd', 12, 2);
            $table->unsignedInteger('listings_count');
            $table->string('trend', 16)->default('stable'); // rising | falling | stable | insufficient
            $table->decimal('brl_factor', 6, 4)->default(1.0);
            $table->json('sources')->nullable();
            $table->json('raw')->nullable();
            $table->timestamp('captured_at')->useCurrent();
            $table->timestamps();
            $table->index(['asset_id', 'captured_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_snapshots');
    }
};
