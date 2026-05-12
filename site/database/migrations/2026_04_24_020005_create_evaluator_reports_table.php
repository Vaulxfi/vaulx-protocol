<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('evaluator_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('evaluator_id')->constrained('users');
            $table->string('layer', 16); // online | offline
            $table->decimal('value_usd', 12, 2);
            $table->string('grade', 8); // mint | ex | vg | g | f
            $table->boolean('has_box')->default(false);
            $table->boolean('has_papers')->default(false);
            // Online-only
            $table->json('visual_condition')->nullable();
            $table->boolean('replica_signs')->default(false);
            // Offline-only
            $table->string('caliber', 32)->nullable();
            $table->boolean('serial_match')->nullable();
            $table->json('movement_condition')->nullable();
            $table->string('authenticity', 16)->nullable(); // authentic | suspect | replica
            $table->decimal('timing_rate', 6, 2)->nullable();
            // Scoring
            $table->json('scores')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->unique(['evaluation_id', 'layer']);
            $table->index('evaluator_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluator_reports');
    }
};
