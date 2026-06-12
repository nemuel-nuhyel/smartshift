<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ShiftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Shift::query()
            ->with(['creator', 'assignments.user', 'tasks.assignments.user'])
            ->orderBy('shift_date')
            ->orderBy('start_time');

        if ($request->user()->isAdmin()) {
            if ($request->filled('user_id')) {
                $query->whereHas('assignments', fn ($inner) => $inner->where('user_id', $request->integer('user_id')));
            }
        } else {
            $query->whereHas('assignments', fn ($inner) => $inner->where('user_id', $request->user()->id));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('shift_date', '>=', $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('shift_date', '<=', $request->string('date_to'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $this->validatePayload($request);
        $shift = Shift::query()->create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($shift->load('creator'), 201);
    }

    public function show(Request $request, Shift $shift): JsonResponse
    {
        abort_unless(
            $request->user()->isAdmin() || $shift->assignments()->where('user_id', $request->user()->id)->exists(),
            403
        );

        return response()->json(
            $shift->load(['creator', 'assignments.user', 'tasks.assignments.user'])
        );
    }

    public function update(Request $request, Shift $shift): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $this->validatePayload($request, $shift);

        $newCapacity = $validated['capacity'] ?? $shift->capacity;
        if ($shift->assignments()->count() > $newCapacity) {
            throw ValidationException::withMessages([
                'capacity' => ['Capacity cannot be lower than the current number of assigned workers.'],
            ]);
        }

        $shift->update($validated);

        return response()->json($shift->fresh()->load('creator'));
    }

    public function destroy(Request $request, Shift $shift): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $shift->delete();

        return response()->json(['message' => 'Shift deleted.']);
    }

    private function validatePayload(Request $request, ?Shift $shift = null): array
    {
        $validated = $request->validate([
            'title' => [$shift ? 'sometimes' : 'required', 'string', 'max:255'],
            'shift_date' => [$shift ? 'sometimes' : 'required', 'date'],
            'start_time' => [$shift ? 'sometimes' : 'required', 'date_format:H:i'],
            'end_time' => [$shift ? 'sometimes' : 'required', 'date_format:H:i'],
            'capacity' => [$shift ? 'sometimes' : 'required', 'integer', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $date = $validated['shift_date'] ?? $shift?->shift_date?->toDateString();
        $start = $validated['start_time'] ?? $shift?->start_time;
        $end = $validated['end_time'] ?? $shift?->end_time;

        if ($date && $start && $end) {
            $startAt = Carbon::parse($date.' '.$start);
            $endAt = Carbon::parse($date.' '.$end);

            if ($endAt->lessThanOrEqualTo($startAt)) {
                throw ValidationException::withMessages([
                    'end_time' => ['End time must be after start time.'],
                ]);
            }
        }

        return $validated;
    }
}
