<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssetTransferRequest;
use App\Http\Resources\AssetTransferResource;
use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssetTransferController extends Controller
{
    /**
     * Display a paginated, searchable transfer history.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $transfers = AssetTransfer::query()
            ->with(['asset.room', 'asset.category', 'fromTeam', 'toTeam', 'fromRoom', 'toRoom', 'fromUser', 'toUser', 'performedBy'])
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('asset', function ($asset) use ($search) {
                        $asset->where('asset_code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    })->orWhere('reason', 'like', "%{$search}%")
                        ->orWhere('transfer_date', 'like', "%{$search}%")
                        ->orWhereHas('performedBy', function ($user) use ($search) {
                            $user->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->query('asset_id'), function ($query, $assetId) {
                $query->where('asset_id', $assetId);
            })
            ->orderByDesc('transfer_date')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(AssetTransferResource::collection($transfers)->response()->getData(true), 'Data mutasi aset berhasil dimuat.');
    }

    /**
     * Record a transfer with its full before/after history.
     */
    public function store(StoreAssetTransferRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $asset = Asset::query()->findOrFail($validated['asset_id']);

        // A damaged asset must remain in storage without a responsible party.
        if ($asset->condition === Asset::CONDITION_DAMAGED
            && (($validated['to_user_id'] ?? null) || ($validated['to_team_id'] ?? null))) {
            throw ValidationException::withMessages([
                'asset_id' => 'A damaged asset cannot be transferred to a team or a user. Only storage room moves are allowed.',
            ]);
        }

        $transfer = DB::transaction(function () use ($validated, $asset) {
            $transfer = AssetTransfer::create([
                'asset_id' => $asset->id,
                'transfer_date' => $validated['transfer_date'],
                'from_team_id' => $asset->team_id,
                'to_team_id' => $validated['to_team_id'] ?? null,
                'from_room_id' => $asset->room_id,
                'to_room_id' => $validated['to_room_id'] ?? null,
                'from_user_id' => $asset->assigned_user_id,
                'to_user_id' => $validated['to_user_id'] ?? null,
                'reason' => $validated['reason'] ?? null,
                'performed_by_id' => $this->user()?->id,
            ]);

            $asset->update([
                'team_id' => $validated['to_team_id'] ?? $asset->team_id,
                'room_id' => $validated['to_room_id'] ?? $asset->room_id,
                'assigned_user_id' => $validated['to_user_id'] ?? $asset->assigned_user_id,
            ]);

            return $transfer;
        });

        return ApiResponse::created([
            'transfer' => new AssetTransferResource(
                $transfer->load(['asset.room', 'asset.category', 'fromTeam', 'toTeam', 'fromRoom', 'toRoom', 'fromUser', 'toUser', 'performedBy'])
            ),
        ], 'Asset transferred successfully.');
    }

    /**
     * Display the specified transfer history record.
     */
    public function show(AssetTransfer $assetTransfer): JsonResponse
    {
        return ApiResponse::success([
            'transfer' => new AssetTransferResource(
                $assetTransfer->load(['asset.room', 'asset.category', 'fromTeam', 'toTeam', 'fromRoom', 'toRoom', 'fromUser', 'toUser', 'performedBy'])
            ),
        ]);
    }
}