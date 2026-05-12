<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddEvaluationStatusesToAssetsTable extends Migration
{
    public function up()
    {
        if (DB::getDriverName() !== 'mysql') {
            return; // SQLite/Postgres stores as string via CHECK constraint already
        }
        DB::statement("ALTER TABLE assets MODIFY COLUMN custody_status ENUM('pending_evaluation','evaluated','with_owner','in_transit','in_custody','released') DEFAULT 'pending_evaluation'");
    }

    public function down()
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        DB::statement("ALTER TABLE assets MODIFY COLUMN custody_status ENUM('with_owner','in_transit','in_custody','released') DEFAULT 'with_owner'");
    }
}
