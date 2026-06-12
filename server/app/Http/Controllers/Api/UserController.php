<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        return response()->json(
            User::query()
                ->withCount(['shiftAssignments', 'taskAssignments'])
                ->orderBy('name')
                ->get()
        );
    }

    public function show(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin() || $request->user()->is($user), 403);

        return response()->json(
            $user->loadCount(['shiftAssignments', 'taskAssignments'])
        );
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $this->validatePayload($request);
        $user = User::query()->create($validated);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->isAdmin() || $actor->is($user), 403);

        $validated = $this->validatePayload($request, $user);

        if (! $actor->isAdmin()) {
            unset($validated['role']);
        }

        $user->fill($validated)->save();

        return response()->json($user->fresh());
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    private function validatePayload(Request $request, ?User $user = null): array
    {
        $validated = $request->validate([
            'name' => [$user ? 'sometimes' : 'required', 'string', 'max:255'],
            'email' => [$user ? 'sometimes' : 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'sometimes' : 'required', 'string', 'min:8', 'confirmed'],
            'role' => [$user ? 'sometimes' : 'required', Rule::in([User::ROLE_ADMIN, User::ROLE_WORKER])],
        ]);

        if (! array_key_exists('password', $validated)) {
            return $validated;
        }

        return $validated;
    }
}
