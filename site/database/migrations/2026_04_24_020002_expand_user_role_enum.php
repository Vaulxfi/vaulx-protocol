<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return; // SQLite stores as string; no alter needed
        }
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('borrower','admin','evaluator_online','evaluator_offline') DEFAULT 'borrower'");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('borrower','admin') DEFAULT 'borrower'");
    }
};
