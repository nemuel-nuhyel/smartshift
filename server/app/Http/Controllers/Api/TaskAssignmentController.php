<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TaskAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TaskAssignment::query()
            ->with(['task.shift', 'user'])
            ->latest();

        if ($request->user()->isAdmin()) {
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->integer('user_id'));
            }
        } else {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('task_id')) {
            $query->where('task_id', $request->integer('task_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'task_id' => ['required', 'exists:tasks,id'],
            'user_id' => ['required', 'exists:users,id'],
            'status' => ['nullable', Rule::in([
                TaskAssignment::STATUS_ASSIGNED,
                TaskAssignment::STATUS_IN_PROGRESS,
                TaskAssignment::STATUS_COMPLETED,
            ])],
        ]);

        $task = Task::query()->with('shift.assignments')->findOrFail($validated['task_id']);
        $user = User::query()->findOrFail($validated['user_id']);

        abort_if(! $user->isWorker(), 422, 'Only workers can be assigned to tasks.');

        if (! $task->shift->assignments()->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'user_id' => ['The worker must be assigned to the related shift before receiving a task.'],
            ]);
        }

        if (TaskAssignment::query()->where('task_id', $task->id)->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'user_id' => ['This worker already has the selected task assignment.'],
            ]);
        }

        $taskAssignment = TaskAssignment::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'status' => $validated['status'] ?? TaskAssignment::STATUS_ASSIGNED,
        ]);

        return response()->json($taskAssignment->load(['task.shift', 'user']), 201);
    }

    public function show(Request $request, TaskAssignment $taskAssignment): JsonResponse
    {
        abort_unless($request->user()->isAdmin() || $request->user()->is($taskAssignment->user), 403);

        return response()->json($taskAssignment->load(['task.shift', 'user']));
    }

    public function update(Request $request, TaskAssignment $taskAssignment): JsonResponse
    {
        abort_unless($request->user()->isAdmin() || $request->user()->is($taskAssignment->user), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                TaskAssignment::STATUS_ASSIGNED,
                TaskAssignment::STATUS_IN_PROGRESS,
                TaskAssignment::STATUS_COMPLETED,
            ])],
        ]);

        $taskAssignment->update($validated);

        return response()->json($taskAssignment->fresh()->load(['task.shift', 'user']));
    }

    public function destroy(Request $request, TaskAssignment $taskAssignment): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $taskAssignment->delete();

        return response()->json(['message' => 'Task assignment removed.']);
    }
}
