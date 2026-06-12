<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PlannerController;
use App\Http\Controllers\Api\ShiftAssignmentController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\ShiftSwapRequestController;
use App\Http\Controllers\Api\TaskAssignmentController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::middleware('throttle:auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/planner', [PlannerController::class, 'index']);
        Route::patch('/planner/assignments/reorder', [PlannerController::class, 'reorder']);

        Route::apiResource('users', UserController::class);
        Route::apiResource('shifts', ShiftController::class);
        Route::apiResource('shift-assignments', ShiftAssignmentController::class);
        Route::apiResource('tasks', TaskController::class);
        Route::apiResource('task-assignments', TaskAssignmentController::class);
        Route::get('/shift-swap-requests/options', [ShiftSwapRequestController::class, 'options']);
        Route::apiResource('shift-swap-requests', ShiftSwapRequestController::class);
    });
});
