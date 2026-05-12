<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Evaluation;
use Illuminate\Http\Request;

class OwnerDecisionController extends Controller
{
    public function showRange(Asset $asset)
    {
        abort_unless($asset->user_id === auth()->id(), 403);
        $evaluation = $asset->evaluation()->firstOrFail();
        abort_unless($evaluation->status === Evaluation::STATUS_PENDING_OWNER, 409,
            'The evaluation is not waiting for your decision.');

        return view('owner.evaluation.range', compact('asset', 'evaluation'));
    }

    public function decide(Request $request, Asset $asset)
    {
        abort_unless($asset->user_id === auth()->id(), 403);
        $evaluation = $asset->evaluation()->firstOrFail();
        abort_unless($evaluation->status === Evaluation::STATUS_PENDING_OWNER, 409);

        $data = $request->validate(['decision' => 'required|in:advance,abort']);

        $evaluation->update([
            'owner_decision' => $data['decision'] === 'advance',
            'owner_decided_at' => now(),
            'status' => $data['decision'] === 'advance'
                ? Evaluation::STATUS_PENDING_OFFLINE
                : Evaluation::STATUS_ABORTED,
        ]);

        $msg = $data['decision'] === 'advance'
            ? 'You chose to advance. Please deliver the watch to the offline evaluator.'
            : 'Evaluation ended per your decision.';

        return redirect()->route('borrower.dashboard')->with('success', $msg);
    }
}
