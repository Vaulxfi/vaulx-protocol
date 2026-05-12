<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The original onchain_events migration put a column-level UNIQUE on
 * `signature`, which broke the very-real Solana case where a single tx
 * emits multiple events (e.g. create_ccb_trdc fires both
 * `CcbTrdcCreated` from the loan program AND `TrdcStateInitialized`
 * from the trdc program in the SAME tx). Each event becomes a separate
 * row, but they share a signature — so the second insert silently
 * collides on the unique key.
 *
 * Drop the single-column unique and replace with a composite
 * (signature, event_name) unique. Same dedup intent (a webhook retry
 * for the same event-on-the-same-tx still no-ops) but now allows
 * multiple events per tx.
 */
class FixOnchainEventsSignatureUnique extends Migration
{
    public function up(): void
    {
        Schema::table('onchain_events', function (Blueprint $table) {
            // Drop the auto-named unique index on `signature`. Laravel's
            // default name is `<table>_<col>_unique`.
            $table->dropUnique(['signature']);
            // Composite unique: same (sig, event_name) → blocked. Different
            // events under the same sig → allowed (the multi-event-per-tx
            // case). Nullable signatures still allowed because MySQL treats
            // NULL as distinct in unique indexes.
            $table->unique(['signature', 'event_name'], 'onchain_events_sig_evt_unique');
        });
    }

    public function down(): void
    {
        Schema::table('onchain_events', function (Blueprint $table) {
            $table->dropUnique('onchain_events_sig_evt_unique');
            $table->unique('signature');
        });
    }
}
