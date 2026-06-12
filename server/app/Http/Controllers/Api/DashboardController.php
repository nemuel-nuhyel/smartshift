<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\ShiftSwapRequest;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json([
                'metrics' => [
                    'workers' => User::query()->where('role', User::ROLE_WORKER)->count(),
                    'shifts' => Shift::query()->count(),
                    'tasks' => Task::query()->count(),
                    'pending_swaps' => ShiftSwapRequest::query()
                        ->where('status', ShiftSwapRequest::STATUS_PENDING)
                        ->count(),
                ],
                'upcoming_shifts' => Shift::query()
                    ->with('assignments.user')
                    ->orderBy('shift_date')
                    ->orderBy('start_time')
                    ->limit(5)
                    ->get(),
                'recent_tasks' => Task::query()
                    ->with('shift')
                    ->latest()
                    ->limit(5)
                    ->get(),
            ]);
        }

        return response()->json([
            'metrics' => [
                'upcoming_shifts' => $user->shiftAssignments()->whereHas('shift', function ($query): void {
                    $query->whereDate('shift_date', '>=', now()->toDateString());
                })->count(),
                'assigned_tasks' => $user->taskAssignments()->count(),
                'incoming_swaps' => ShiftSwapRequest::query()
                    ->whereHas('targetAssignment', fn ($query) => $query->where('user_id', $user->id))
                    ->where('status', ShiftSwapRequest::STATUS_PENDING)
                    ->count(),
            ],
            'upcoming_shifts' => $user->shiftAssignments()
                ->with('shift')
                ->whereHas('shift', function ($query): void {
                    $query->whereDate('shift_date', '>=', now()->toDateString());
                })
                ->get()
                ->sortBy(fn ($assignment) => sprintf(
                    '%s %s',
                    $assignment->shift->shift_date->toDateString(),
                    $assignment->shift->start_time,
                ))
                ->values()
                ->take(5),
            'tasks' => $user->taskAssignments()
                ->with('task.shift')
                ->latest()
                ->limit(5)
                ->get(),
        ]);
    }
}
