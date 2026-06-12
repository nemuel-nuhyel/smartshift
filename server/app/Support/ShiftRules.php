<?php

namespace App\Support;

use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class ShiftRules
{
    public static function ensureCapacity(Shift $shift, ?ShiftAssignment $ignoreAssignment = null): void
    {
        $count = $shift->assignments()
            ->when($ignoreAssignment, fn ($query) => $query->whereKeyNot($ignoreAssignment->id))
            ->count();

        if ($count >= $shift->capacity) {
            throw ValidationException::withMessages([
                'shift_id' => ['This shift is already at capacity.'],
            ]);
        }
    }

    public static function ensureNoConflict(User $user, Shift $candidateShift, ?ShiftAssignment $ignoreAssignment = null): void
    {
        $assignments = $user->shiftAssignments()
            ->with('shift')
            ->when($ignoreAssignment, fn ($query) => $query->whereKeyNot($ignoreAssignment->id))
            ->get();

        $conflict = $assignments->first(fn (ShiftAssignment $assignment) => self::overlaps($assignment->shift, $candidateShift));

        if ($conflict) {
            throw ValidationException::withMessages([
                'shift_id' => ['This worker already has an overlapping shift assignment.'],
            ]);
        }
    }

    public static function overlaps(Shift $first, Shift $second): bool
    {
        if ($first->shift_date?->toDateString() !== $second->shift_date?->toDateString()) {
            return false;
        }

        $firstStart = Carbon::parse($first->shift_date->toDateString().' '.$first->start_time);
        $firstEnd = Carbon::parse($first->shift_date->toDateString().' '.$first->end_time);
        $secondStart = Carbon::parse($second->shift_date->toDateString().' '.$second->start_time);
        $secondEnd = Carbon::parse($second->shift_date->toDateString().' '.$second->end_time);

        return $firstStart->lt($secondEnd) && $firstEnd->gt($secondStart);
    }
}
