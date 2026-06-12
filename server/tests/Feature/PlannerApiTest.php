<?php

namespace Tests\Feature;

use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlannerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_planner_assignment(): void
    {
        $admin = User::factory()->admin()->create();
        $worker = User::factory()->create();
        $shift = Shift::query()->create([
            'created_by' => $admin->id,
            'title' => 'Morning',
            'shift_date' => '2026-05-01',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'capacity' => 2,
            'location' => 'Zone A',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->patchJson('/api/planner/assignments/reorder', [
            'user_id' => $worker->id,
            'to_shift_id' => $shift->id,
            'position' => 0,
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('shift_assignments', [
            'shift_id' => $shift->id,
            'user_id' => $worker->id,
        ]);
    }

    public function test_planner_rejects_overlapping_shift_assignments(): void
    {
        $admin = User::factory()->admin()->create();
        $worker = User::factory()->create();

        $firstShift = Shift::query()->create([
            'created_by' => $admin->id,
            'title' => 'Morning',
            'shift_date' => '2026-05-01',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'capacity' => 2,
            'location' => 'Zone A',
        ]);

        $secondShift = Shift::query()->create([
            'created_by' => $admin->id,
            'title' => 'Overlap',
            'shift_date' => '2026-05-01',
            'start_time' => '11:00',
            'end_time' => '15:00',
            'capacity' => 2,
            'location' => 'Zone B',
        ]);

        ShiftAssignment::query()->create([
            'shift_id' => $firstShift->id,
            'user_id' => $worker->id,
            'status' => ShiftAssignment::STATUS_ASSIGNED,
            'sort_order' => 0,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->patchJson('/api/planner/assignments/reorder', [
            'user_id' => $worker->id,
            'to_shift_id' => $secondShift->id,
            'position' => 0,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('shift_id');
    }
}
