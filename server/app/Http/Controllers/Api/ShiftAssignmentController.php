<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\User;
use App\Support\ShiftRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ShiftAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ShiftAssignment::query()
            ->with(['shift', 'user'])
            ->orderByDesc('created_at');

        if ($request->user()->isAdmin()) {
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->integer('user_id'));
            }
        } else {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->integer('shift_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'shift_id' => ['required', 'exists:shifts,id'],
            'user_id' => ['required', 'exists:users,id'],
            'status' => ['nullable', Rule::in([
                ShiftAssignment::STATUS_ASSIGNED,
                ShiftAssignment::STATUS_COMPLETED,
                ShiftAssignment::STATUS_CANCELLED,
            ])],
        ]);

        $shift = Shift::query()->with('assignments')->findOrFail($validated['shift_id']);
        $user = User::query()->findOrFail($validated['user_id']);

        abort_if(! $user->isWorker(), 422, 'Only workers can be assigned to shifts.');

        if (ShiftAssignment::query()->where('shift_id', $shift->id)->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'user_id' => ['This worker is already assigned to the selected shift.'],
            ]);
        }

        ShiftRules::ensureCapacity($shift);
        ShiftRules::ensureNoConflict($user, $shift);

        $assignment = ShiftAssignment::query()->create([
            'shift_id' => $shift->id,
            'user_id' => $user->id,
            'status' => $validated['status'] ?? ShiftAssignment::STATUS_ASSIGNED,
            'sort_order' => $shift->assignments()->count(),
        ]);

        return response()->json($assignment->load(['shift', 'user']), 201);
    }

    public function show(Request $request, ShiftAssignment $shiftAssignment): JsonResponse
    {
        abort_unless($this->canAccess($request, $shiftAssignment), 403);

        return response()->json($shiftAssignment->load(['shift', 'user']));
    }

    public function update(Request $request, ShiftAssignment $shiftAssignment): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->isAdmin() || $actor->is($shiftAssignment->user), 403);

        if (! $actor->isAdmin()) {
            $validated = $request->validate([
                'status' => ['required', Rule::in([
                    ShiftAssignment::STATUS_ASSIGNED,
                    ShiftAssignment::STATUS_COMPLETED,
                    ShiftAssignment::STATUS_CANCELLED,
                ])],
            ]);

            $shiftAssignment->update(['status' => $validated['status']]);

            return response()->json($shiftAssignment->fresh()->load(['shift', 'user']));
        }

        $validated = $request->validate([
            'shift_id' => ['sometimes', 'exists:shifts,id'],
            'user_id' => ['sometimes', 'exists:users,id'],
            'status' => ['sometimes', Rule::in([
                ShiftAssignment::STATUS_ASSIGNED,
                ShiftAssignment::STATUS_COMPLETED,
                ShiftAssignment::STATUS_CANCELLED,
            ])],
        ]);

        $newShift = array_key_exists('shift_id', $validated)
            ? Shift::query()->with('assignments')->findOrFail($validated['shift_id'])
            : $shiftAssignment->shift()->with('assignments')->first();
        $newUser = array_key_exists('user_id', $validated)
            ? User::query()->findOrFail($validated['user_id'])
            : $shiftAssignment->user;

        abort_if(! $newUser->isWorker(), 422, 'Only workers can be assigned to shifts.');

        $duplicate = ShiftAssignment::query()
            ->where('shift_id', $newShift->id)
            ->where('user_id', $newUser->id)
            ->whereKeyNot($shiftAssignment->id)
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'user_id' => ['This worker already has the target shift assignment.'],
            ]);
        }

        if ($newShift->id !== $shiftAssignment->shift_id || $newUser->id !== $shiftAssignment->user_id) {
            ShiftRules::ensureCapacity($newShift, $shiftAssignment->shift_id === $newShift->id ? $shiftAssignment : null);
            ShiftRules::ensureNoConflict($newUser, $newShift, $shiftAssignment);
        }

        if ($newShift->id !== $shiftAssignment->shift_id) {
            $validated['sort_order'] = $newShift->assignments()->whereKeyNot($shiftAssignment->id)->count();
        }

        $shiftAssignment->update($validated);

        return response()->json($shiftAssignment->fresh()->load(['shift', 'user']));
    }

    public function destroy(Request $request, ShiftAssignment $shiftAssignment): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $shiftId = $shiftAssignment->shift_id;
        $shiftAssignment->delete();

        ShiftAssignment::query()
            ->where('shift_id', $shiftId)
            ->orderBy('sort_order')
            ->get()
            ->values()
            ->each(fn (ShiftAssignment $assignment, int $index) => $assignment->update(['sort_order' => $index]));

        return response()->json(['message' => 'Shift assignment removed.']);
    }

    private function canAccess(Request $request, ShiftAssignment $shiftAssignment): bool
    {
        return $request->user()->isAdmin() || $request->user()->is($shiftAssignment->user);
    }
}
