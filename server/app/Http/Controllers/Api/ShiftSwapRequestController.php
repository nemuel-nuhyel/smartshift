<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShiftAssignment;
use App\Models\ShiftSwapRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ShiftSwapRequestController extends Controller
{
    public function options(Request $request): JsonResponse
    {
        abort_unless($request->user()->isWorker(), 403);

        return response()->json([
            'source_assignments' => ShiftAssignment::query()
                ->with(['shift', 'user'])
                ->where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->get(),
            'target_assignments' => ShiftAssignment::query()
                ->with(['shift', 'user'])
                ->where('user_id', '!=', $request->user()->id)
                ->orderByDesc('created_at')
                ->limit(100)
                ->get(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = ShiftSwapRequest::query()
            ->with([
                'requester',
                'sourceAssignment.shift',
                'sourceAssignment.user',
                'targetAssignment.shift',
                'targetAssignment.user',
            ])
            ->latest();

        if (! $request->user()->isAdmin()) {
            $query->where(function ($inner) use ($request): void {
                $inner->where('requester_id', $request->user()->id)
                    ->orWhereHas('targetAssignment', fn ($target) => $target->where('user_id', $request->user()->id));
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isWorker(), 403);

        $validated = $request->validate([
            'source_assignment_id' => ['required', 'exists:shift_assignments,id'],
            'target_assignment_id' => ['nullable', 'exists:shift_assignments,id', 'different:source_assignment_id'],
            'reason' => ['nullable', 'string'],
        ]);

        $source = ShiftAssignment::query()->with('shift')->findOrFail($validated['source_assignment_id']);
        $target = array_key_exists('target_assignment_id', $validated) && $validated['target_assignment_id']
            ? ShiftAssignment::query()->with('shift')->findOrFail($validated['target_assignment_id'])
            : null;

        abort_unless($source->user_id === $request->user()->id, 403);

        if ($target && $target->user_id === $request->user()->id) {
            throw ValidationException::withMessages([
                'target_assignment_id' => ['You cannot request a swap with your own assignment.'],
            ]);
        }

        $swapRequest = ShiftSwapRequest::query()->create([
            'requester_id' => $request->user()->id,
            'source_assignment_id' => $source->id,
            'target_assignment_id' => $target?->id,
            'status' => ShiftSwapRequest::STATUS_PENDING,
            'reason' => $validated['reason'] ?? null,
        ]);

        return response()->json($this->loadRequest($swapRequest), 201);
    }

    public function show(Request $request, ShiftSwapRequest $shiftSwapRequest): JsonResponse
    {
        abort_unless($this->canAccess($request, $shiftSwapRequest), 403);

        return response()->json($this->loadRequest($shiftSwapRequest));
    }

    public function update(Request $request, ShiftSwapRequest $shiftSwapRequest): JsonResponse
    {
        $actor = $request->user();
        abort_unless($this->canAccess($request, $shiftSwapRequest), 403);

        if ($actor->isAdmin()) {
            return $this->handleAdminUpdate($request, $shiftSwapRequest);
        }

        if ($actor->id === $shiftSwapRequest->requester_id) {
            return $this->handleRequesterUpdate($request, $shiftSwapRequest);
        }

        return $this->handleTargetWorkerUpdate($request, $shiftSwapRequest);
    }

    public function destroy(Request $request, ShiftSwapRequest $shiftSwapRequest): JsonResponse
    {
        abort_unless(
            $request->user()->isAdmin()
            || ($request->user()->id === $shiftSwapRequest->requester_id && $shiftSwapRequest->status === ShiftSwapRequest::STATUS_PENDING),
            403
        );

        $shiftSwapRequest->delete();

        return response()->json(['message' => 'Swap request deleted.']);
    }

    private function handleRequesterUpdate(Request $request, ShiftSwapRequest $shiftSwapRequest): JsonResponse
    {
        abort_unless($shiftSwapRequest->status === ShiftSwapRequest::STATUS_PENDING, 403);

        $validated = $request->validate([
            'target_assignment_id' => ['nullable', 'exists:shift_assignments,id', 'different:source_assignment_id'],
            'reason' => ['nullable', 'string'],
        ]);

        if (array_key_exists('target_assignment_id', $validated) && $validated['target_assignment_id']) {
            $target = ShiftAssignment::query()->findOrFail($validated['target_assignment_id']);

            if ($target->user_id === $request->user()->id) {
                throw ValidationException::withMessages([
                    'target_assignment_id' => ['You cannot request a swap with your own assignment.'],
                ]);
            }
        }

        $shiftSwapRequest->update($validated);

        return response()->json($this->loadRequest($shiftSwapRequest));
    }

    private function handleTargetWorkerUpdate(Request $request, ShiftSwapRequest $shiftSwapRequest): JsonResponse
    {
        abort_unless($shiftSwapRequest->status === ShiftSwapRequest::STATUS_PENDING, 403);
        abort_unless($shiftSwapRequest->targetAssignment?->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                ShiftSwapRequest::STATUS_ACCEPTED_BY_WORKER,
                ShiftSwapRequest::STATUS_REJECTED_BY_WORKER,
            ])],
        ]);

        $shiftSwapRequest->update($validated);

        return response()->json($this->loadRequest($shiftSwapRequest));
    }

    private function handleAdminUpdate(Request $request, ShiftSwapRequest $shiftSwapRequest): JsonResponse
    {
        abort_unless($shiftSwapRequest->status === ShiftSwapRequest::STATUS_ACCEPTED_BY_WORKER, 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                ShiftSwapRequest::STATUS_APPROVED,
                ShiftSwapRequest::STATUS_REJECTED,
            ])],
        ]);

        if ($validated['status'] === ShiftSwapRequest::STATUS_REJECTED) {
            $shiftSwapRequest->update(['status' => ShiftSwapRequest::STATUS_REJECTED]);

            return response()->json($this->loadRequest($shiftSwapRequest));
        }

        if (! $shiftSwapRequest->targetAssignment) {
            throw ValidationException::withMessages([
                'status' => ['A target assignment is required before approval.'],
            ]);
        }

        DB::transaction(function () use ($shiftSwapRequest): void {
            $shiftSwapRequest->loadMissing(['sourceAssignment.shift.tasks', 'targetAssignment.shift.tasks']);

            $sourceAssignment = $shiftSwapRequest->sourceAssignment;
            $targetAssignment = $shiftSwapRequest->targetAssignment;

            $sourceUserId = $sourceAssignment->user_id;
            $targetUserId = $targetAssignment->user_id;

            $sourceAssignment->update(['user_id' => $targetUserId]);
            $targetAssignment->update(['user_id' => $sourceUserId]);

            foreach ($sourceAssignment->shift->tasks as $task) {
                $task->assignments()->where('user_id', $sourceUserId)->update(['user_id' => $targetUserId]);
            }

            foreach ($targetAssignment->shift->tasks as $task) {
                $task->assignments()->where('user_id', $targetUserId)->update(['user_id' => $sourceUserId]);
            }

            $shiftSwapRequest->update(['status' => ShiftSwapRequest::STATUS_APPROVED]);
        });

        return response()->json($this->loadRequest($shiftSwapRequest->fresh()));
    }

    private function loadRequest(ShiftSwapRequest $shiftSwapRequest): ShiftSwapRequest
    {
        return $shiftSwapRequest->load([
            'requester',
            'sourceAssignment.shift',
            'sourceAssignment.user',
            'targetAssignment.shift',
            'targetAssignment.user',
        ]);
    }

    private function canAccess(Request $request, ShiftSwapRequest $shiftSwapRequest): bool
    {
        return $request->user()->isAdmin()
            || $shiftSwapRequest->requester_id === $request->user()->id
            || $shiftSwapRequest->targetAssignment?->user_id === $request->user()->id;
    }
}
