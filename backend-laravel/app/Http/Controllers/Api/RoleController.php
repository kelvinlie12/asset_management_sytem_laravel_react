<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignPermissionsToRoleRequest;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * System roles that must never be deleted.
     *
     * @var list<string>
     */
    private const PROTECTED_ROLES = ['super_admin', 'admin', 'staff', 'viewer'];

    /**
     * Display a list of roles with their permissions.
     */
    public function index(Request $request): JsonResponse
    {
        $roles = Role::query()
            ->with('permissions')
            ->when($request->query('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('id')
            ->get();

        return ApiResponse::success(RoleResource::collection($roles)->response()->getData(true), 'Data peran berhasil dimuat.');
    }

    /**
     * Store a newly created role.
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = Role::create([
            'name' => $request->validated('name'),
            'guard_name' => 'web',
        ]);

        return ApiResponse::created([
            'role' => new RoleResource($role->load('permissions')),
        ], 'Role created successfully.');
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): JsonResponse
    {
        return ApiResponse::success([
            'role' => new RoleResource($role->load('permissions')),
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $role->update([
            'name' => $request->validated('name'),
        ]);

        return ApiResponse::success([
            'role' => new RoleResource($role->fresh()->load('permissions')),
        ], 'Role updated successfully.');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Request $request, Role $role): JsonResponse
    {
        if (in_array($role->name, self::PROTECTED_ROLES, true)) {
            return ApiResponse::error('This system role cannot be deleted.', ['role' => ['Peran sistem tidak dapat dihapus.']], 422);
        }

        if ($role->users()->exists()) {
            return ApiResponse::error('Cannot delete a role that is still assigned to users.', ['role' => ['Peran masih digunakan oleh pengguna.']], 422);
        }

        $role->permissions()->detach();
        $role->delete();

        return ApiResponse::noContent('Role deleted successfully.');
    }

    /**
     * Assign permissions to a role.
     */
    public function assignPermissions(AssignPermissionsToRoleRequest $request, Role $role): JsonResponse
    {
        $role->permissions()->sync($request->validated('permission_ids'));

        return ApiResponse::success([
            'role' => new RoleResource($role->fresh()->load('permissions')),
        ], 'Permissions assigned successfully.');
    }
}
