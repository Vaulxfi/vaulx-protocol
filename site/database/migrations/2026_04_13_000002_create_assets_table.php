<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAssetsTable extends Migration
{
    public function up()
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Asset info
            $table->enum('category', ['watch', 'jewelry', 'art', 'vehicle']);
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->text('description');
            $table->year('year')->nullable();
            $table->string('condition', 20)->default('excellent'); // excellent, good, fair

            // Valuation
            $table->decimal('estimated_value', 15, 2);
            $table->decimal('appraised_value', 15, 2)->nullable();
            $table->string('appraiser')->nullable();
            $table->date('appraisal_date')->nullable();

            // Custody
            $table->enum('custody_status', ['pending_evaluation', 'evaluated', 'with_owner', 'in_transit', 'in_custody', 'released'])
                  ->default('pending_evaluation');
            $table->string('custody_location')->nullable();
            $table->timestamp('custody_received_at')->nullable();

            // Solana (Devnet Demo - dados mockados)
            $table->string('nft_mint_address', 44)->nullable();
            $table->string('metadata_uri')->nullable();
            $table->string('mint_tx_hash', 88)->nullable();

            // Photos
            $table->json('photo_urls')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'category']);
            $table->index('custody_status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('assets');
    }
}
