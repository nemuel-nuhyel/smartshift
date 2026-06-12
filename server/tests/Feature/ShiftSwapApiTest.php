<?php

namespace Tests\Feature;

use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\ShiftSwapRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ShiftSwapApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_worker_swap_can_be_accepted_and_approved(): void
    {
        $admin = User::factory()->admin()->create();
        $requester = User::factory()->create();
        $targetWorker = User::factory()->create();

        $morning = Shift::query()->create([
            'created_by' => $admin->id,
            'title' => 'Morning',
            'shift_date' => '2026-05-01',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'capacity' => 3,
            'location' => 'Zone A',
        ]);

        $afternoon = Shift::query()->create([
            'created_by' => $admin->id,
            'title' => 'Afternoon',
            'shift_date' => '2026-05-01',
            'start_time' => '13:00',
            'end_time' => '17:00',
            'capacity' => 3,
            'location' => 'Zone B',
        ]);

        $source = ShiftAssignment::query()->create([
            'shift_id' => $morning->id,
            'user_id' => $requester->id,
            'status' => ShiftAssignment::STATUS_ASSIGNED,
            'sort_order' => 0,
        ]);

        $target = ShiftAssignment::query()->create([
            'shift_id' => $afternoon->id,
            'user_id' => $targetWorker->id,
            'status' => ShiftAssignment::STATUS_ASSIGNED,
            'sort_order' => 0,
        ]);

        Sanctum::actingAs($requester);

        $createResponse = $this->postJson('/api/shift-swap-requests', [
            'source_assignment_id' => $source->id,
            'target_assignment_id' => $target->id,
            'reason' => 'Need the later shift.',
        ]);

        $createResponse->assertCreated();

        $swapId = $createResponse->json('id');

        Sanctum::actingAs($targetWorker);
        $this->patchJson("/api/shift-swap-requests/{$swapId}", [
            'status' => ShiftSwapRequest::STATUS_ACCEPTED_BY_WORKER,
        ])->assertOk();

        Sanctum::actingAs($admin);
        $this->patchJson("/api/shift-swap-requests/{$swapId}", [
            'status' => ShiftSwapRequest::STATUS_APPROVED,
        ])->assertOk();

        $this->assertDatabaseHas('shift_assignments', [
            'id' => $source->id,
            'user_id' => $targetWorker->id,
        ]);

        $this->assertDatabaseHas('shift_assignments', [
            'id' => $target->id,
            'user_id' => $requester->id,
        ]);

        $this->assertDatabaseHas('shift_swap_requests', [
            'id' => $swapId,
            'status' => ShiftSwapRequest::STATUS_APPROVED,
        ]);
    }
}
