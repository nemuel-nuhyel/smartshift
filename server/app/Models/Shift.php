<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Shift extends Model
{
    protected $fillable = [
        'created_by',
        'title',
        'shift_date',
        'start_time',
        'end_time',
        'capacity',
        'location',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'shift_date' => 'date',
            'capacity' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ShiftAssignment::class)->orderBy('sort_order');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function taskAssignments(): HasManyThrough
    {
        return $this->hasManyThrough(TaskAssignment::class, Task::class);
    }
}
