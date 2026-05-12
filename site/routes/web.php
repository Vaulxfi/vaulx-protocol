<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Api\SiwsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BorrowerController;
use App\Http\Controllers\DemoSessionController;
use App\Http\Controllers\EvaluatorController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OwnerDecisionController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SuperAdminController;
use Illuminate\Support\Facades\Route;

// --- Public ---
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/simulator', [HomeController::class, 'simulator'])->name('simulator');
Route::get('/terms', function () { return view('terms'); })->name('terms');
Route::get('/faq', function () { return view('faq'); })->name('faq');
Route::get('/team', function () { return view('team'); })->name('team');

// --- Demo magic link (token-gated, cross-origin session cookie) ---
// See app/Http/Controllers/DemoSessionController.php. Companion endpoint
// POST /api/demo/reset lives in routes/api.php.
Route::get('/demo', [DemoSessionController::class, 'magicLink'])->name('demo.magic');

// --- Auth ---
Route::middleware(['guest', 'auth.nocache'])->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

// --- Live CSRF token ---
// Returns the current session's _token as plain text, with no-store headers.
// Used by inline JS on auth views to overwrite cached form fields, defeating
// the nginx fastcgi_cache that was triggering 419 in production.
Route::middleware('auth.nocache')->get('/csrf-fresh', function () {
    return response(csrf_token(), 200, ['Content-Type' => 'text/plain']);
})->name('csrf.fresh');

// --- Password reset ---
Route::middleware(['guest', 'auth.nocache'])->group(function () {
    Route::get('/forgot-password', [PasswordResetController::class, 'showForgot'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'sendLink'])->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'showReset'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->name('password.update');
});

// --- SIWS (Sign in With Solana) — session-backed ---
Route::prefix('auth/siws')->group(function () {
    Route::get('/challenge', [SiwsController::class, 'challenge'])->name('siws.challenge');
    Route::post('/verify', [SiwsController::class, 'verify'])->name('siws.verify');
});

// --- Profile (shared) ---
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/link-solana', [ProfileController::class, 'linkSolana'])->name('profile.link-solana');
});

// --- Borrower ---
Route::middleware('auth')->prefix('dashboard')->name('borrower.')->group(function () {
    Route::get('/', [BorrowerController::class, 'dashboard'])->name('dashboard');
    Route::get('/asset/new', [BorrowerController::class, 'createAsset'])->name('asset.create');
    Route::post('/asset', [BorrowerController::class, 'storeAsset'])->name('asset.store');
    Route::get('/asset/{asset}', [BorrowerController::class, 'showAsset'])->name('asset.show');
    Route::get('/loan/request', [BorrowerController::class, 'requestLoan'])->name('loan.request');
    Route::post('/loan/request', [BorrowerController::class, 'storeLoan'])->name('loan.store');
    Route::get('/loans', [BorrowerController::class, 'myLoans'])->name('loans');
    Route::get('/loan/{loan}', [BorrowerController::class, 'showLoan'])->name('loan.show');
    Route::post('/installment/{payment}/pay', [BorrowerController::class, 'payInstallment'])->name('payment.pay');

    // Re-loan one-click (asset already evaluated)
    Route::get('/asset/{asset}/reloan', [BorrowerController::class, 'showReloan'])->name('reloan.show');
    Route::post('/asset/{asset}/reloan', [BorrowerController::class, 'storeReloan'])->name('reloan.store');
});

// --- Evaluator (unified dashboard) ---
Route::middleware(['auth', 'evaluator.any'])->prefix('evaluator')->name('evaluator.')->group(function () {
    Route::get('/', [EvaluatorController::class, 'dashboard'])->name('dashboard');
});

// --- Evaluator online forms (role-gated) ---
Route::middleware(['auth', 'evaluator.online'])->prefix('evaluator/online')->name('evaluator.online.')->group(function () {
    Route::get('/', [EvaluatorController::class, 'online'])->name('index');
    Route::get('/{evaluation}', [EvaluatorController::class, 'showOnline'])->name('show');
    Route::post('/{evaluation}', [EvaluatorController::class, 'submitOnline'])->name('submit');
});

// --- Evaluator offline forms (role-gated) ---
Route::middleware(['auth', 'evaluator.offline'])->prefix('evaluator/offline')->name('evaluator.offline.')->group(function () {
    Route::get('/', [EvaluatorController::class, 'offline'])->name('index');
    Route::get('/{evaluation}', [EvaluatorController::class, 'showOffline'])->name('show');
    Route::post('/{evaluation}', [EvaluatorController::class, 'submitOffline'])->name('submit');
});

// --- Owner decision on range ---
Route::middleware('auth')->prefix('evaluation')->name('evaluation.')->group(function () {
    Route::get('/{asset}/range', [OwnerDecisionController::class, 'showRange'])->name('range');
    Route::post('/{asset}/decide', [OwnerDecisionController::class, 'decide'])->name('decide');
});

// --- Admin ---
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');

    // Legacy single-layer asset evaluation (will coexist under feature flag)
    Route::get('/evaluations', [AdminController::class, 'pendingAssets'])->name('assets.pending');
    Route::get('/evaluation/{asset}', [AdminController::class, 'evaluateAsset'])->name('asset.evaluate');
    Route::post('/evaluation/{asset}/approve', [AdminController::class, 'approveEvaluation'])->name('asset.approve');

    // Loans
    Route::get('/loans', [AdminController::class, 'loans'])->name('loans');
    Route::get('/loan/{loan}', [AdminController::class, 'showLoan'])->name('loan.show');
    Route::post('/loan/{loan}/approve', [AdminController::class, 'approveCustody'])->name('loan.approve');
    Route::post('/loan/{loan}/default', [AdminController::class, 'markDefaulted'])->name('loan.default');
    Route::post('/loan/{loan}/repaid', [AdminController::class, 'markRepaid'])->name('loan.repaid');

    // Super Admin (evaluation module)
    Route::get('/market-config', [SuperAdminController::class, 'marketConfig'])->name('market-config.index');
    Route::post('/market-config', [SuperAdminController::class, 'storeMarketConfig'])->name('market-config.store');
    Route::post('/market-config/{config}/delete', [SuperAdminController::class, 'deleteMarketConfig'])->name('market-config.delete');
    Route::get('/evaluators', [SuperAdminController::class, 'evaluatorsList'])->name('evaluators.index');
    Route::post('/evaluators/assign', [SuperAdminController::class, 'assignEvaluation'])->name('evaluators.assign');

    // Other pages
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::get('/vaults', [AdminController::class, 'vaults'])->name('vaults');
    Route::get('/multisig', [AdminController::class, 'multisig'])->name('multisig');
    Route::get('/monitor-brz', [AdminController::class, 'monitorBrz'])->name('monitor-brz');
    Route::get('/cron-bot', [AdminController::class, 'cronBot'])->name('cron-bot');
    Route::get('/onchain-events', [AdminController::class, 'eventosOnchain'])->name('eventos-onchain');
});
