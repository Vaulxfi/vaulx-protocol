<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('market_snapshot_id')->nullable()->constrained('market_snapshots');
            $table->foreignId('online_evaluator_id')->nullable()->constrained('users');
            $table->foreignId('offline_evaluator_id')->nullable()->constrained('users');
            $table->string('status', 32)->default('pending_online');
            // pending_online → pending_owner_decision → pending_offline → consolidated → aborted
            $table->decimal('range_min', 12, 2)->nullable();
            $table->decimal('range_max', 12, 2)->nullable();
            $table->boolean('owner_decision')->nullable();
            $table->timestamp('owner_decided_at')->nullable();
            $table->decimal('final_value', 12, 2)->nullable();
            $table->json('alerts')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
