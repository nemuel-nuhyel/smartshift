<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftSwapRequest extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED_BY_WORKER = 'accepted_by_worker';

    public const STATUS_REJECTED_BY_WORKER = 'rejected_by_worker';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'requester_id',
        'source_assignment_id',
        'target_assignment_id',
        'status',
        'reason',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function sourceAssignment(): BelongsTo
    {
        return $this->belongsTo(ShiftAssignment::class, 'source_assignment_id');
    }

    public function targetAssignment(): BelongsTo
    {
        return $this->belongsTo(ShiftAssignment::class, 'target_assignment_id');
    }
}
