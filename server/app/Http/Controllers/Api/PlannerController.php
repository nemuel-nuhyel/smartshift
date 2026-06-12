<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\User;
use App\Support\ShiftRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlannerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        return response()->json([
            'workers' => User::query()
                ->where('role', User::ROLE_WORKER)
                ->orderBy('name')
                ->get(),
            'shifts' => Shift::query()
                ->with(['assignments.user', 'creator'])
                ->orderBy('shift_date')
                ->orderBy('start_time')
                ->get(),
        ]);
    }

    public function reorder(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'from_shift_id' => ['nullable', 'exists:shifts,id'],
            'to_shift_id' => ['nullable', 'exists:shifts,id'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $user = User::query()->findOrFail($validated['user_id']);
        abort_if(! $user->isWorker(), 422, 'Only workers can be placed on the planner.');

        $toShiftId = $validated['to_shift_id'] ?? null;
        $currentAssignment = null;

        if ($validated['from_shift_id'] ?? null) {
            $currentAssignment = ShiftAssignment::query()
                ->where('user_id', $user->id)
                ->where('shift_id', $validated['from_shift_id'])
                ->first();
        } elseif ($toShiftId) {
            $currentAssignment = ShiftAssignment::query()
                ->where('user_id', $user->id)
                ->where('shift_id', $toShiftId)
                ->first();
        }

        $oldShiftId = $currentAssignment?->shift_id;

        if (! $toShiftId) {
            abort_unless($currentAssignment !== null, 422);
            $currentAssignment->delete();
            $this->normalizeShiftOrders($oldShiftId);

            return $this->index($request);
        }

        $targetShift = Shift::query()->with('assignments')->findOrFail($toShiftId);

        if (! $currentAssignment || $currentAssignment->shift_id !== $targetShift->id) {
            ShiftRules::ensureCapacity($targetShift, $currentAssignment?->shift_id === $targetShift->id ? $currentAssignment : null);
            ShiftRules::ensureNoConflict($user, $targetShift, $currentAssignment);
        }

        if (! $currentAssignment) {
            $currentAssignment = ShiftAssignment::query()->create([
                'shift_id' => $targetShift->id,
                'user_id' => $user->id,
                'status' => ShiftAssignment::STATUS_ASSIGNED,
                'sort_order' => $targetShift->assignments()->count(),
            ]);
        } elseif ($currentAssignment->shift_id !== $targetShift->id) {
            $currentAssignment->update([
                'shift_id' => $targetShift->id,
                'sort_order' => $targetShift->assignments()->count(),
            ]);
        }

        if ($oldShiftId && $oldShiftId !== $targetShift->id) {
            $this->normalizeShiftOrders($oldShiftId);
        }

        $this->placeAssignment(
            $currentAssignment->fresh(),
            $targetShift->id,
            $validated['position'] ?? null,
        );

        return $this->index($request);
    }

    private function placeAssignment(ShiftAssignment $assignment, int $shiftId, ?int $position): void
    {
        $ids = ShiftAssignment::query()
            ->where('shift_id', $shiftId)
            ->whereKeyNot($assignment->id)
            ->orderBy('sort_order')
            ->pluck('id')
            ->all();

        $insertAt = $position === null ? count($ids) : min($position, count($ids));
        array_splice($ids, $insertAt, 0, [$assignment->id]);

        foreach ($ids as $index => $id) {
            ShiftAssignment::query()->whereKey($id)->update(['sort_order' => $index]);
        }
    }

    private function normalizeShiftOrders(?int $shiftId): void
    {
        if (! $shiftId) {
            return;
        }

        ShiftAssignment::query()
            ->where('shift_id', $shiftId)
            ->orderBy('sort_order')
            ->get()
            ->values()
            ->each(fn (ShiftAssignment $assignment, int $index) => $assignment->update(['sort_order' => $index]));
    }
}
