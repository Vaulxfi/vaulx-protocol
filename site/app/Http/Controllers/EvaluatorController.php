<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluatorReport;
use App\Models\User;
use App\Notifications\OfflineReportCompleted;
use App\Notifications\OnlineReportCompleted;
use App\Notifications\SuspiciousAlignmentDetected;
use App\Notifications\TripleConvergenceBonus;
use App\Services\ScoringService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EvaluatorController extends Controller
{
    public function dashboard()
    {
        $user = auth()->user();
        $userId = $user->id;
        $isAdmin = $user->isAdmin();
        $canOnline = $isAdmin || $user->isEvaluatorOnline();
        $canOffline = $isAdmin || $user->isEvaluatorOffline();

        $onlineQuery = Evaluation::query()->with('asset.user')
            ->where('status', Evaluation::STATUS_PENDING_ONLINE);
        $offlineQuery = Evaluation::query()->with('asset.user')
            ->where('status', Evaluation::STATUS_PENDING_OFFLINE);

        // Show both assigned-to-me AND unassigned (pool) items.
        // Evaluators "claim" unassigned on click by entering the form.
        if (!$isAdmin) {
            $onlineQuery->where(function ($q) use ($userId) {
                $q->whereNull('online_evaluator_id')->orWhere('online_evaluator_id', $userId);
            });
            $offlineQuery->where(function ($q) use ($userId) {
                $q->whereNull('offline_evaluator_id')->orWhere('offline_evaluator_id', $userId);
            });
        }

        $pendingOnline = $canOnline ? $onlineQuery->latest()->get() : collect();
        $pendingOffline = $canOffline ? $offlineQuery->latest()->get() : collect();

        $onlineScore = $canOnline ? $user->evaluatorScore('online') : null;
        $offlineScore = $canOffline ? $user->evaluatorScore('offline') : null;

        $recent = Evaluation::query()
            ->with('asset.user')
            ->when(!$isAdmin, fn ($q) => $q->where(function ($x) use ($userId) {
                $x->where('online_evaluator_id', $userId)
                  ->orWhere('offline_evaluator_id', $userId);
            }))
            ->whereIn('status', [
                Evaluation::STATUS_PENDING_OWNER,
                Evaluation::STATUS_CONSOLIDATED,
                Evaluation::STATUS_ABORTED,
            ])
            ->latest()
            ->take(15)
            ->get();

        return view('evaluator.dashboard', compact(
            'pendingOnline', 'pendingOffline',
            'canOnline', 'canOffline',
            'onlineScore', 'offlineScore',
            'recent'
        ));
    }

    public function online()
    {
        return redirect()->route('evaluator.dashboard');
    }

    public function onlineLegacy()
    {
        $userId = auth()->id();
        $assigned = Evaluation::query()
            ->with('asset.user', 'marketSnapshot')
            ->where('online_evaluator_id', $userId)
            ->where('status', Evaluation::STATUS_PENDING_ONLINE)
            ->latest()
            ->get();

        $done = Evaluation::query()
            ->with('asset.user')
            ->where('online_evaluator_id', $userId)
            ->whereIn('status', [
                Evaluation::STATUS_PENDING_OWNER,
                Evaluation::STATUS_PENDING_OFFLINE,
                Evaluation::STATUS_CONSOLIDATED,
            ])
            ->latest()
            ->take(10)
            ->get();

        $score = auth()->user()->evaluatorScore('online');

        return view('evaluator.online.dashboard', compact('assigned', 'done', 'score'));
    }

    public function showOnline(Evaluation $evaluation)
    {
        abort_unless($evaluation->status === Evaluation::STATUS_PENDING_ONLINE, 409, 'Already submitted.');

        // Auto-claim unassigned items (first evaluator to open wins)
        if (is_null($evaluation->online_evaluator_id) && !auth()->user()->isAdmin()) {
            $claimed = Evaluation::where('id', $evaluation->id)
                ->whereNull('online_evaluator_id')
                ->update(['online_evaluator_id' => auth()->id()]);
            if ($claimed) { $evaluation->refresh(); }
        }

        $this->ensureOwnsOnline($evaluation);
        $evaluation->load('asset.user');
        return view('evaluator.online.form', compact('evaluation'));
    }

    public function submitOnline(Request $request, Evaluation $evaluation)
    {
        $this->ensureOwnsOnline($evaluation);
        abort_unless($evaluation->status === Evaluation::STATUS_PENDING_ONLINE, 409);

        $data = $request->validate([
            'value_usd' => 'required|numeric|min:100',
            'grade' => 'required|in:mint,ex,vg,g,f',
            'has_box' => 'sometimes|boolean',
            'has_papers' => 'sometimes|boolean',
            'replica_signs' => 'sometimes|boolean',
            'dial_grade' => 'required|in:mint,ex,vg,g,f',
            'case_grade' => 'required|in:mint,ex,vg,g,f',
            'bracelet_grade' => 'required|in:mint,ex,vg,g,f',
            'glass_grade' => 'required|in:mint,ex,vg,g,f',
            'crown_grade' => 'required|in:mint,ex,vg,g,f',
        ]);

        EvaluatorReport::create([
            'evaluation_id' => $evaluation->id,
            'evaluator_id' => auth()->id(),
            'layer' => 'online',
            'value_usd' => $data['value_usd'],
            'grade' => $data['grade'],
            'has_box' => (bool) ($data['has_box'] ?? false),
            'has_papers' => (bool) ($data['has_papers'] ?? false),
            'replica_signs' => (bool) ($data['replica_signs'] ?? false),
            'visual_condition' => [
                'dial' => $data['dial_grade'],
                'case' => $data['case_grade'],
                'bracelet' => $data['bracelet_grade'],
                'glass' => $data['glass_grade'],
                'crown' => $data['crown_grade'],
            ],
            'submitted_at' => now(),
        ]);

        // Generate range for owner based on online value ± market spread (owner doesn't see exact)
        $snapshot = $evaluation->marketSnapshot;
        $base = (float) $data['value_usd'];
        $min = $snapshot ? max($base * 0.9, (float) $snapshot->min_usd) : $base * 0.85;
        $max = $snapshot ? min($base * 1.1, (float) $snapshot->max_usd) : $base * 1.15;

        $evaluation->update([
            'range_min' => round($min, 2),
            'range_max' => round($max, 2),
            'status' => Evaluation::STATUS_PENDING_OWNER,
        ]);

        try {
            $evaluation->asset->user->notify(new OnlineReportCompleted($evaluation->fresh()));
        } catch (\Throwable $e) {
            Log::warning('OnlineReportCompleted notification failed', ['message' => $e->getMessage()]);
        }

        return redirect()->route('evaluator.online.index')
            ->with('success', 'Online report submitted. Owner will decide whether to proceed to the offline step.');
    }

    public function offline()
    {
        return redirect()->route('evaluator.dashboard');
    }

    public function offlineLegacy()
    {
        $userId = auth()->id();
        $assigned = Evaluation::query()
            ->with('asset.user')
            ->where('offline_evaluator_id', $userId)
            ->where('status', Evaluation::STATUS_PENDING_OFFLINE)
            ->latest()
            ->get();

        $done = Evaluation::query()
            ->with('asset.user')
            ->where('offline_evaluator_id', $userId)
            ->where('status', Evaluation::STATUS_CONSOLIDATED)
            ->latest()
            ->take(10)
            ->get();

        $score = auth()->user()->evaluatorScore('offline');

        return view('evaluator.offline.dashboard', compact('assigned', 'done', 'score'));
    }

    public function showOffline(Evaluation $evaluation)
    {
        abort_unless($evaluation->status === Evaluation::STATUS_PENDING_OFFLINE, 409, 'Not ready for offline.');

        if (is_null($evaluation->offline_evaluator_id) && !auth()->user()->isAdmin()) {
            $claimed = Evaluation::where('id', $evaluation->id)
                ->whereNull('offline_evaluator_id')
                ->update(['offline_evaluator_id' => auth()->id()]);
            if ($claimed) { $evaluation->refresh(); }
        }

        $this->ensureOwnsOffline($evaluation);
        $evaluation->load('asset.user');
        return view('evaluator.offline.form', compact('evaluation'));
    }

    public function submitOffline(Request $request, Evaluation $evaluation)
    {
        $this->ensureOwnsOffline($evaluation);
        abort_unless($evaluation->status === Evaluation::STATUS_PENDING_OFFLINE, 409);

        $data = $request->validate([
            'value_usd' => 'required|numeric|min:100',
            'grade' => 'required|in:mint,ex,vg,g,f',
            'has_box' => 'sometimes|boolean',
            'has_papers' => 'sometimes|boolean',
            'caliber' => 'required|string|max:32',
            'serial_match' => 'required|boolean',
            'authenticity' => 'required|in:authentic,suspect,replica',
            'timing_rate' => 'nullable|numeric',
            'movement_notes' => 'nullable|string|max:2000',
        ]);

        EvaluatorReport::create([
            'evaluation_id' => $evaluation->id,
            'evaluator_id' => auth()->id(),
            'layer' => 'offline',
            'value_usd' => $data['value_usd'],
            'grade' => $data['grade'],
            'has_box' => (bool) ($data['has_box'] ?? false),
            'has_papers' => (bool) ($data['has_papers'] ?? false),
            'caliber' => $data['caliber'],
            'serial_match' => (bool) $data['serial_match'],
            'authenticity' => $data['authenticity'],
            'timing_rate' => $data['timing_rate'] ?? null,
            'movement_condition' => [
                'notes' => $data['movement_notes'] ?? null,
            ],
            'submitted_at' => now(),
        ]);

        $result = ScoringService::consolidate($evaluation->fresh('onlineReport', 'offlineReport', 'marketSnapshot'));
        $fresh = $evaluation->fresh(['asset.user', 'onlineReport', 'offlineReport']);

        $admins = User::where('role', 'admin')->get();

        // Always: notify owner + admins that the evaluation is consolidated.
        try {
            $fresh->asset->user->notify(new OfflineReportCompleted($fresh));
        } catch (\Throwable $e) {
            Log::warning('OfflineReportCompleted owner notification failed', ['message' => $e->getMessage()]);
        }
        foreach ($admins as $admin) {
            try {
                $admin->notify(new OfflineReportCompleted($fresh));
            } catch (\Throwable $e) {
                Log::warning('OfflineReportCompleted admin notification failed', ['message' => $e->getMessage()]);
            }
        }

        // Triangle alerts: suspicious alignment → admins; triple convergence → both evaluators.
        foreach ($result['alerts'] as $alert) {
            $type = $alert['type'] ?? null;

            if ($type === 'suspicious_alignment') {
                foreach ($admins as $admin) {
                    try {
                        $admin->notify(new SuspiciousAlignmentDetected($fresh, $alert));
                    } catch (\Throwable $e) {
                        Log::warning('SuspiciousAlignment notification failed', ['message' => $e->getMessage()]);
                    }
                }
                continue;
            }

            if ($type === 'triple_convergence') {
                $bonus = (int) ($alert['bonus'] ?? config('garantifi.scoring.convergence_bonus', 5));
                $evaluatorIds = array_filter([
                    $fresh->online_evaluator_id,
                    $fresh->offline_evaluator_id,
                ]);
                foreach (User::whereIn('id', $evaluatorIds)->get() as $evaluator) {
                    try {
                        $evaluator->notify(new TripleConvergenceBonus($fresh, $bonus));
                    } catch (\Throwable $e) {
                        Log::warning('TripleConvergenceBonus notification failed', ['message' => $e->getMessage()]);
                    }
                }
            }
        }

        return redirect()->route('evaluator.offline.index')
            ->with('success', 'Offline report submitted. Evaluation consolidated.');
    }

    protected function ensureOwnsOnline(Evaluation $evaluation): void
    {
        if (auth()->user()->isAdmin()) return;
        abort_unless($evaluation->online_evaluator_id === auth()->id(), 403);
    }

    protected function ensureOwnsOffline(Evaluation $evaluation): void
    {
        if (auth()->user()->isAdmin()) return;
        abort_unless($evaluation->offline_evaluator_id === auth()->id(), 403);
    }
}
