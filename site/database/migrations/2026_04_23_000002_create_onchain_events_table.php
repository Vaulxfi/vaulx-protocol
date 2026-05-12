<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('onchain_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_name', 64)->index();
            $table->string('signature', 128)->nullable()->unique();
            $table->unsignedBigInteger('slot')->nullable()->index();
            $table->string('program_id', 64)->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->index('occurred_at');
        });

        Schema::create('cron_runs', function (Blueprint $table) {
            $table->id();
            $table->string('name', 64)->index();
            $table->integer('scanned')->default(0);
            $table->integer('affected')->default(0);
            $table->string('status', 20)->default('ok');
            $table->text('notes')->nullable();
            $table->timestamp('ran_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onchain_events');
        Schema::dropIfExists('cron_runs');
    }
};
