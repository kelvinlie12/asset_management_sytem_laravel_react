<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignRoleRequest;
use App\Http\Requests\AssignTeamRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    private const ROLE_RANK = [
        User::ROLE_VIEWER => 1,
        User::ROLE_STAFF => 2,
        User::ROLE_ADMIN => 3,
        User::ROLE_SUPER_ADMIN => 4,
    ];
    /**
     * Display a paginated, searchable list of users.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $users = User::query()
            ->with('team')
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->query('role'), function ($query, $role) {
                $query->where('role', $role);
            })
            ->when($request->query('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->query('team_id'), function ($query, $teamId) {
                $query->where('team_id', $teamId);
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(UserResource::collection($users)->response()->getData(true), 'Data pengguna berhasil dimuat.');
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (! $this->canSetRole($request->user(), $validated['role'])) {
            return ApiResponse::error('You are not allowed to assign this role.', null, 403);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'team_id' => $validated['team_id'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'] ?? User::STATUS_ACTIVE,
        ]);

        // Keep Spatie's role in sync with the newly assigned role.
        $user->syncRoleToSpatie();

        return ApiResponse::created([
            'user' => new UserResource($user->load('team')),
        ], 'User created successfully.');
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return ApiResponse::success([
            'user' => new UserResource($user->load('team')),
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        if (isset($validated['role']) && ! $this->canSetRole($request->user(), $validated['role'])) {
            return ApiResponse::error('You are not allowed to assign this role.', null, 403);
        }

        if (array_key_exists('password', $validated) && empty($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        // If the role changed, keep Spatie's role in sync.
        if (isset($validated['role'])) {
            $user->syncRoleToSpatie();
        }

        return ApiResponse::success([
            'user' => new UserResource($user->fresh()->load('team')),
        ], 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->tokens()->delete();
        $user->delete();

        return ApiResponse::noContent('User deleted successfully.');
    }

    /**
     * Determine whether the given acting user is allowed to set the target role.
     */
    private function canSetRole(User $actor, string $role): bool
    {
        if ($actor->isSuperAdmin()) {
            return true;
        }

        return self::ROLE_RANK[$role] < self::ROLE_RANK[$actor->role];
    }

    /**
     * Assign a role to the specified user.
     */
    public function assignRole(AssignRoleRequest $request, User $user): JsonResponse
    {
        $role = $request->validated('role');

        if (! $this->canSetRole($request->user(), $role)) {
            return ApiResponse::error('You are not allowed to assign this role.', null, 403);
        }

        $user->update([
            'role' => $role,
        ]);

        // Keep Spatie's role in sync with the legacy role column.
        $user->syncRoleToSpatie();

        // Role change may alter token abilities; force a fresh login.
        $user->tokens()->delete();

        return ApiResponse::success([
            'user' => new UserResource($user->fresh()->load('team')),
        ], 'Role assigned successfully.');
    }

    /**
     * Assign a team to the specified user.
     */
    public function assignTeam(AssignTeamRequest $request, User $user): JsonResponse
    {
        $user->update([
            'team_id' => $request->validated('team_id'),
        ]);

        return ApiResponse::success([
            'user' => new UserResource($user->fresh()->load('team')),
        ], 'Team assigned successfully.');
    }

    /**
     * Reset the specified user's password.
     */
    public function resetPassword(ResetPasswordRequest $request, User $user): JsonResponse
    {
        $user->update([
            'password' => $request->validated('password'),
        ]);

        $user->tokens()->delete();

        return ApiResponse::noContent('Password reset successfully.');
    }

    /**
     * Deactivate (disable) the specified user.
     */
    public function deactivate(Request $request, User $user): JsonResponse
    {
        $this->authorize('deactivate', $user);

        $user->update([
            'status' => User::STATUS_INACTIVE,
        ]);

        // Revoke the user's sessions so they are immediately logged out.
        $user->tokens()->delete();

        return ApiResponse::success([
            'user' => new UserResource($user->fresh()->load('team')),
        ], 'User deactivated successfully.');
    }

    /**
     * Activate (enable) the specified user.
     */
    public function activate(Request $request, User $user): JsonResponse
    {
        $this->authorize('activate', $user);

        $user->update([
            'status' => User::STATUS_ACTIVE,
        ]);

        return ApiResponse::success([
            'user' => new UserResource($user->fresh()->load('team')),
        ], 'User activated successfully.');
    }
}
