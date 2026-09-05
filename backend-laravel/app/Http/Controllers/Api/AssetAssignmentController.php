<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssetAssignmentRequest;
use App\Http\Resources\AssetAssignmentResource;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssetAssignmentController extends Controller
{
    /**
     * Display a paginated, searchable history of asset assignments.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $assignments = AssetAssignment::query()
            ->with(['asset.room', 'asset.category', 'team', 'room', 'assignedUser'])
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('asset', function ($asset) use ($search) {
                        $asset->where('asset_code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    })->orWhereHas('team', function ($team) use ($search) {
                        $team->where('name', 'like', "%{$search}%");
                    })->orWhereHas('assignedUser', function ($user) use ($search) {
                        $user->where('name', 'like', "%{$search}%");
                    })->orWhere('assigned_date', 'like', "%{$search}%");
                });
            })
            ->when($request->query('asset_id'), function ($query, $assetId) {
                $query->where('asset_id', $assetId);
            })
            ->orderByDesc('assigned_date')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(AssetAssignmentResource::collection($assignments)->response()->getData(true), 'Data penempatan aset berhasil dimuat.');
    }

    /**
     * Assign an asset and append the placement to its history.
     */
    public function store(StoreAssetAssignmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $asset = Asset::query()->findOrFail($validated['asset_id']);
        if ($asset->condition === Asset::CONDITION_DAMAGED) {
            throw ValidationException::withMessages([
                'asset_id' => 'A damaged asset cannot be assigned to a user or room.',
            ]);
        }

        $assignment = DB::transaction(function () use ($validated, $asset) {
            $assignment = AssetAssignment::create([
                'asset_id' => $asset->id,
                'team_id' => $validated['team_id'] ?? null,
                'room_id' => $validated['room_id'] ?? null,
                'assigned_user_id' => $validated['assigned_user_id'] ?? null,
                'assigned_date' => $validated['assigned_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $asset->update([
                'usage_status' => Asset::USAGE_IN_USE,
                'team_id' => $validated['team_id'] ?? $asset->team_id,
                'room_id' => $validated['room_id'] ?? $asset->room_id,
                'assigned_user_id' => $validated['assigned_user_id'] ?? $asset->assigned_user_id,
            ]);

            return $assignment;
        });

        return ApiResponse::created([
            'assignment' => new AssetAssignmentResource(
                $assignment->load(['asset.room', 'asset.category', 'asset.team', 'asset.assignedUser', 'team', 'room', 'assignedUser'])
            ),
        ], 'Asset assigned. The asset is now IN_USE and the placement history has been saved.');
    }

    /**
     * Display the specified assignment history record.
     */
    public function show(AssetAssignment $assetAssignment): JsonResponse
    {
        return ApiResponse::success([
            'assignment' => new AssetAssignmentResource(
                $assetAssignment->load(['asset.room', 'asset.category', 'asset.team', 'asset.assignedUser', 'team', 'room', 'assignedUser'])
            ),
        ]);
    }
}