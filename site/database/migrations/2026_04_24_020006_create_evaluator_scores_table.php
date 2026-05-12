<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('evaluator_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('layer', 16); // online | offline
            $table->decimal('current_score', 5, 2)->default(0);
            $table->unsignedTinyInteger('tier')->default(1);
            $table->unsignedInteger('total_reports')->default(0);
            $table->json('history')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'layer']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluator_scores');
    }
};
