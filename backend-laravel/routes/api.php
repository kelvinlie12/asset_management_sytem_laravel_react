<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AssetAssignmentController;
use App\Http\Controllers\Api\AssetTransferController;
use App\Http\Controllers\Api\AssetDamageController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleTaxReminderController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\UserController;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

Route::name('login')->get('/login', function () {
    return ApiResponse::error('Unauthenticated.', null, 401);
});

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])
            ->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile'])
            ->middleware('permission:profile.update');
        Route::put('/change-password', [AuthController::class, 'changePassword'])
            ->middleware('permission:profile.password');

        // User Management (admin and above)
        Route::middleware(['permission:user.manage'])->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::get('/users/{user}', [UserController::class, 'show']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
            Route::put('/users/{user}/assign-role', [UserController::class, 'assignRole']);
            Route::put('/users/{user}/assign-team', [UserController::class, 'assignTeam']);
            Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::post('/users/{user}/deactivate', [UserController::class, 'deactivate']);
            Route::post('/users/{user}/activate', [UserController::class, 'activate']);
        });

        // Team management
        Route::get('/teams', [TeamController::class, 'index'])->middleware('permission:teams.view');
        Route::post('/teams', [TeamController::class, 'store'])->middleware('permission:teams.create');
        Route::get('/teams/{team}', [TeamController::class, 'show'])->middleware('permission:teams.view');
        Route::put('/teams/{team}', [TeamController::class, 'update'])->middleware('permission:teams.update');
        Route::delete('/teams/{team}', [TeamController::class, 'destroy'])->middleware('permission:teams.delete');
        Route::put('/teams/{team}/rooms', [TeamController::class, 'assignRooms'])->middleware('permission:teams.update');

        // Room (Ruangan) management
        Route::get('/rooms', [RoomController::class, 'index'])->middleware('permission:rooms.view');
        Route::post('/rooms', [RoomController::class, 'store'])->middleware('permission:rooms.create');
        Route::get('/rooms/{room}', [RoomController::class, 'show'])->middleware('permission:rooms.view');
        Route::put('/rooms/{room}', [RoomController::class, 'update'])->middleware('permission:rooms.update');
        Route::delete('/rooms/{room}', [RoomController::class, 'destroy'])->middleware('permission:rooms.delete');

        // Category (Kategori Barang) management
        Route::get('/categories', [CategoryController::class, 'index'])->middleware('permission:categories.view');
        Route::post('/categories', [CategoryController::class, 'store'])->middleware('permission:categories.create');
        Route::get('/categories/{category}', [CategoryController::class, 'show'])->middleware('permission:categories.view');
        Route::put('/categories/{category}', [CategoryController::class, 'update'])->middleware('permission:categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:categories.delete');

        // Asset (Barang) management
        Route::get('/assets', [AssetController::class, 'index'])->middleware('permission:assets.view');
        Route::post('/assets', [AssetController::class, 'store'])->middleware('permission:assets.create');
        Route::get('/assets/{asset}', [AssetController::class, 'show'])->middleware('permission:assets.view');
        Route::put('/assets/{asset}', [AssetController::class, 'update'])->middleware('permission:assets.update');
        Route::delete('/assets/{asset}', [AssetController::class, 'destroy'])->middleware('permission:assets.delete');

        // Purchase (Pembelian Barang) management
        Route::get('/purchases', [PurchaseController::class, 'index'])->middleware('permission:purchases.view');
        Route::post('/purchases', [PurchaseController::class, 'store'])->middleware('permission:purchases.create');
        Route::get('/purchases/{purchase}', [PurchaseController::class, 'show'])->middleware('permission:purchases.view');
        Route::delete('/purchases/{purchase}', [PurchaseController::class, 'destroy'])->middleware('permission:purchases.delete');

        // Asset Assignment (Penempatan Barang) history
        Route::get('/assignments', [AssetAssignmentController::class, 'index'])->middleware('permission:assignments.view');
        Route::post('/assignments', [AssetAssignmentController::class, 'store'])->middleware('permission:assignments.create');
        Route::get('/assignments/{assetAssignment}', [AssetAssignmentController::class, 'show'])->middleware('permission:assignments.view');

        // Asset Transfer (Mutasi Barang) history
        Route::get('/transfers', [AssetTransferController::class, 'index'])->middleware('permission:transfers.view');
        Route::post('/transfers', [AssetTransferController::class, 'store'])->middleware('permission:transfers.create');
        Route::get('/transfers/{assetTransfer}', [AssetTransferController::class, 'show'])->middleware('permission:transfers.view');

        // Asset Damage Report (Barang Rusak) history
        Route::get('/damages', [AssetDamageController::class, 'index'])->middleware('permission:damages.view');
        Route::post('/damages', [AssetDamageController::class, 'store'])->middleware('permission:damages.create');
        Route::get('/damages/{assetDamage}', [AssetDamageController::class, 'show'])->middleware('permission:damages.view');
        Route::put('/damages/{assetDamage}', [AssetDamageController::class, 'update'])->middleware('permission:damages.update');
        Route::delete('/damages/{assetDamage}', [AssetDamageController::class, 'destroy'])->middleware('permission:damages.delete');

        // Vehicle Asset (Motor) management
        Route::get('/vehicles', [VehicleController::class, 'index'])->middleware('permission:vehicles.view');
        Route::post('/vehicles', [VehicleController::class, 'store'])->middleware('permission:vehicles.create');
        Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show'])->middleware('permission:vehicles.view');
        Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update'])->middleware('permission:vehicles.update');
        Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->middleware('permission:vehicles.delete');

        // Vehicle Tax Reminder
        Route::get('/vehicle-tax-reminders', [VehicleTaxReminderController::class, 'index'])->middleware('permission:vehicles.view');

        // Role management (RBAC)
        Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:roles.view');
        Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:roles.create');
        Route::get('/roles/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view');
        Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');
        Route::put('/roles/{role}/permissions', [RoleController::class, 'assignPermissions'])->middleware('permission:roles.update');

        // Permission management (RBAC)
        Route::get('/permissions', [PermissionController::class, 'index'])->middleware('permission:permissions.view');
        Route::post('/permissions', [PermissionController::class, 'store'])->middleware('permission:permissions.create');
        Route::get('/permissions/{permission}', [PermissionController::class, 'show'])->middleware('permission:permissions.view');
        Route::put('/permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:permissions.update');
        Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:permissions.delete');

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'show'])->middleware('permission:assets.view');
    });
});
