<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Http\Resources\PermissionResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display a list of permissions.
     */
    public function index(Request $request): JsonResponse
    {
        $permissions = Permission::query()
            ->when($request->query('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->get();

        return ApiResponse::success(PermissionResource::collection($permissions)->response()->getData(true), 'Data izin berhasil dimuat.');
    }

    /**
     * Store a newly created permission.
     */
    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = Permission::create([
            'name' => $request->validated('name'),
            'guard_name' => 'web',
        ]);

        return ApiResponse::created([
            'permission' => new PermissionResource($permission),
        ], 'Permission created successfully.');
    }

    /**
     * Display the specified permission.
     */
    public function show(Permission $permission): JsonResponse
    {
        return ApiResponse::success([
            'permission' => new PermissionResource($permission),
        ]);
    }

    /**
     * Update the specified permission.
     */
    public function update(UpdatePermissionRequest $request, Permission $permission): JsonResponse
    {
        $permission->update([
            'name' => $request->validated('name'),
        ]);

        return ApiResponse::success([
            'permission' => new PermissionResource($permission->fresh()),
        ], 'Permission updated successfully.');
    }

    /**
     * Remove the specified permission.
     */
    public function destroy(Request $request, Permission $permission): JsonResponse
    {
        if ($permission->roles()->exists()) {
            return ApiResponse::error('Cannot delete a permission that is assigned to roles.', ['permission' => ['Izin masih digunakan oleh peran.']], 422);
        }

        $permission->delete();

        return ApiResponse::noContent('Permission deleted successfully.');
    }
}
