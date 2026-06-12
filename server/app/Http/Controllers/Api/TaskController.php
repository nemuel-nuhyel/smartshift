<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Task::query()
            ->with(['shift.assignments.user', 'assignments.user'])
            ->latest();

        if (! $request->user()->isAdmin()) {
            $query->whereHas('shift.assignments', fn ($inner) => $inner->where('user_id', $request->user()->id));
        }

        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->integer('shift_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $this->validatePayload($request);
        $task = Task::query()->create($validated);

        return response()->json($task->load(['shift.assignments.user', 'assignments.user']), 201);
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        abort_unless($this->canView($request, $task), 403);

        return response()->json($task->load(['shift.assignments.user', 'assignments.user']));
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $actor = $request->user();

        if ($actor->isAdmin()) {
            $validated = $this->validatePayload($request, $task);
        } else {
            abort_unless(
                $task->assignments()->where('user_id', $actor->id)->exists(),
                403
            );

            $validated = $request->validate([
                'status' => ['required', Rule::in([
                    Task::STATUS_OPEN,
                    Task::STATUS_IN_PROGRESS,
                    Task::STATUS_DONE,
                ])],
            ]);
        }

        $task->update($validated);

        return response()->json($task->fresh()->load(['shift.assignments.user', 'assignments.user']));
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    private function validatePayload(Request $request, ?Task $task = null): array
    {
        return $request->validate([
            'shift_id' => [$task ? 'sometimes' : 'required', 'exists:shifts,id'],
            'title' => [$task ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => [$task ? 'sometimes' : 'required', Rule::in([
                Task::PRIORITY_LOW,
                Task::PRIORITY_MEDIUM,
                Task::PRIORITY_HIGH,
            ])],
            'status' => [$task ? 'sometimes' : 'required', Rule::in([
                Task::STATUS_OPEN,
                Task::STATUS_IN_PROGRESS,
                Task::STATUS_DONE,
            ])],
        ]);
    }

    private function canView(Request $request, Task $task): bool
    {
        return $request->user()->isAdmin()
            || $task->shift->assignments()->where('user_id', $request->user()->id)->exists();
    }
}
