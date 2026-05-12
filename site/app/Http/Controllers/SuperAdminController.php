<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluatorScore;
use App\Models\MarketConfig;
use App\Models\User;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    public function marketConfig()
    {
        $configs = MarketConfig::orderBy('brand')->orderBy('family')->paginate(20);
        return view('admin.market-config.index', compact('configs'));
    }

    public function storeMarketConfig(Request $request)
    {
        $data = $request->validate([
            'brand' => 'required|string|max:64',
            'family' => 'nullable|string|max:64',
            'brl_factor' => 'required|numeric|min:0.1|max:5',
            'notes' => 'nullable|string|max:255',
        ]);
        MarketConfig::updateOrCreate(
            ['brand' => $data['brand'], 'family' => $data['family'] ?? null],
            ['brl_factor' => $data['brl_factor'], 'notes' => $data['notes'] ?? null]
        );
        return back()->with('success', 'Market config saved.');
    }

    public function deleteMarketConfig(MarketConfig $config)
    {
        $config->delete();
        return back()->with('success', 'Market config removed.');
    }

    public function evaluatorsList()
    {
        $online = User::query()
            ->where('role', 'evaluator_online')
            ->with(['evaluatorScores' => fn ($q) => $q->where('layer', 'online')])
            ->get();
        $offline = User::query()
            ->where('role', 'evaluator_offline')
            ->with(['evaluatorScores' => fn ($q) => $q->where('layer', 'offline')])
            ->get();

        $pending = Evaluation::query()
            ->whereIn('status', [Evaluation::STATUS_PENDING_ONLINE, Evaluation::STATUS_PENDING_OFFLINE])
            ->with('asset.user')
            ->get();

        return view('admin.evaluators.index', compact('online', 'offline', 'pending'));
    }

    public function assignEvaluation(Request $request)
    {
        $data = $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'user_id' => 'required|exists:users,id',
            'layer' => 'required|in:online,offline',
        ]);
        $eval = Evaluation::findOrFail($data['evaluation_id']);
        $user = User::findOrFail($data['user_id']);
        if ($data['layer'] === 'online' && !$user->isEvaluatorOnline()) {
            return back()->with('error', 'User is not an online evaluator.');
        }
        if ($data['layer'] === 'offline' && !$user->isEvaluatorOffline()) {
            return back()->with('error', 'User is not an offline evaluator.');
        }
        $column = $data['layer'] === 'online' ? 'online_evaluator_id' : 'offline_evaluator_id';
        $eval->update([$column => $user->id]);
        return back()->with('success', "Assigned {$user->name} as {$data['layer']} evaluator.");
    }
}
