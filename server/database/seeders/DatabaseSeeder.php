<?php

namespace Database\Seeders;

use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\ShiftSwapRequest;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@smartshift.test'],
            [
                'name' => 'Warehouse Admin',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
            ],
        );

        $workers = collect([
            ['name' => 'Alice Picker', 'email' => 'alice@smartshift.test'],
            ['name' => 'Ben Loader', 'email' => 'ben@smartshift.test'],
            ['name' => 'Carla Packer', 'email' => 'carla@smartshift.test'],
            ['name' => 'David Receiver', 'email' => 'david@smartshift.test'],
        ])->map(fn (array $worker) => User::query()->updateOrCreate(
            ['email' => $worker['email']],
            [
                'name' => $worker['name'],
                'password' => Hash::make('password'),
                'role' => User::ROLE_WORKER,
            ],
        ));

        $morning = Shift::query()->updateOrCreate(
            [
                'title' => 'Morning Shift',
                'shift_date' => now()->toDateString(),
                'start_time' => '08:00',
                'end_time' => '12:00',
            ],
            [
                'created_by' => $admin->id,
                'capacity' => 3,
                'location' => 'Zone A',
                'notes' => 'Prioritize inbound pallets.',
            ],
        );

        $afternoon = Shift::query()->updateOrCreate(
            [
                'title' => 'Afternoon Shift',
                'shift_date' => now()->toDateString(),
                'start_time' => '13:00',
                'end_time' => '17:00',
            ],
            [
                'created_by' => $admin->id,
                'capacity' => 3,
                'location' => 'Zone B',
                'notes' => 'Prepare outbound truck orders.',
            ],
        );

        $morningAssignments = [
            ShiftAssignment::query()->updateOrCreate(
                ['shift_id' => $morning->id, 'user_id' => $workers[0]->id],
                ['status' => ShiftAssignment::STATUS_ASSIGNED, 'sort_order' => 0],
            ),
            ShiftAssignment::query()->updateOrCreate(
                ['shift_id' => $morning->id, 'user_id' => $workers[1]->id],
                ['status' => ShiftAssignment::STATUS_ASSIGNED, 'sort_order' => 1],
            ),
        ];

        $afternoonAssignments = [
            ShiftAssignment::query()->updateOrCreate(
                ['shift_id' => $afternoon->id, 'user_id' => $workers[2]->id],
                ['status' => ShiftAssignment::STATUS_ASSIGNED, 'sort_order' => 0],
            ),
            ShiftAssignment::query()->updateOrCreate(
                ['shift_id' => $afternoon->id, 'user_id' => $workers[3]->id],
                ['status' => ShiftAssignment::STATUS_ASSIGNED, 'sort_order' => 1],
            ),
        ];

        $receivingTask = Task::query()->updateOrCreate(
            ['shift_id' => $morning->id, 'title' => 'Unload delivery truck'],
            [
                'description' => 'Check incoming items and stage them for storage.',
                'priority' => Task::PRIORITY_HIGH,
                'status' => Task::STATUS_IN_PROGRESS,
            ],
        );

        $packingTask = Task::query()->updateOrCreate(
            ['shift_id' => $afternoon->id, 'title' => 'Pack outbound orders'],
            [
                'description' => 'Prepare customer parcels for evening dispatch.',
                'priority' => Task::PRIORITY_MEDIUM,
                'status' => Task::STATUS_OPEN,
            ],
        );

        TaskAssignment::query()->updateOrCreate(
            ['task_id' => $receivingTask->id, 'user_id' => $workers[0]->id],
            ['status' => TaskAssignment::STATUS_IN_PROGRESS],
        );

        TaskAssignment::query()->updateOrCreate(
            ['task_id' => $packingTask->id, 'user_id' => $workers[2]->id],
            ['status' => TaskAssignment::STATUS_ASSIGNED],
        );

        ShiftSwapRequest::query()->updateOrCreate(
            ['source_assignment_id' => $morningAssignments[0]->id, 'target_assignment_id' => $afternoonAssignments[0]->id],
            [
                'requester_id' => $workers[0]->id,
                'status' => ShiftSwapRequest::STATUS_PENDING,
                'reason' => 'Need afternoon availability for an appointment.',
            ],
        );
    }
}
