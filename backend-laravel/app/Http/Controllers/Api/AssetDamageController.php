<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssetDamageRequest;
use App\Http\Requests\UpdateAssetDamageRequest;
use App\Http\Resources\AssetDamageResource;
use App\Models\Asset;
use App\Models\AssetDamage;
use App\Models\Room;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class AssetDamageController extends Controller
{
    /**
     * Display a paginated, searchable damage report history.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $damages = AssetDamage::query()
            ->with(['asset.room', 'asset.category', 'room', 'user', 'responsible', 'performedBy'])
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                        ->orWhere('damage_date', 'like', "%{$search}%")
                        ->orWhereHas('asset', function ($asset) use ($search) {
                            $asset->where('asset_code', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('performedBy', function ($user) use ($search) {
                            $user->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->query('asset_id'), function ($query, $assetId) {
                $query->where('asset_id', $assetId);
            })
            ->when($request->query('date_from'), function ($query, $dateFrom) {
                $query->whereDate('damage_date', '>=', $dateFrom);
            })
            ->when($request->query('date_to'), function ($query, $dateTo) {
                $query->whereDate('damage_date', '<=', $dateTo);
            })
            ->orderByDesc('damage_date')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(AssetDamageResource::collection($damages)->response()->getData(true), 'Data laporan kerusakan berhasil dimuat.');
    }

    /**
     * Record a damage report and mark the asset as damaged and stored.
     */
    public function store(StoreAssetDamageRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $ext = strtolower($file->guessExtension() ?: 'bin');
            $name = 'damage_'.md5(uniqid((string) random_int(0, PHP_INT_MAX), true)).'.'.$ext;
            $file->move(public_path('uploads/damages'), $name);
            $photoPath = 'uploads/damages/'.$name;
        }

        $asset = Asset::query()->findOrFail($validated['asset_id']);

        $damage = DB::transaction(function () use ($validated, $asset, $photoPath, $request) {
            $damage = AssetDamage::create([
                'asset_id' => $asset->id,
'room_id' => $validated['room_id'] ?? $asset->room_id,
            'damage_date' => $validated['damage_date'],
                'user_id' => $validated['user_id'] ?? null,
                'responsible_id' => $validated['responsible_id'] ?? null,
                'description' => $validated['description'],
                'photo_path' => $photoPath,
                'notes' => $validated['notes'] ?? null,
                'performed_by_id' => $request->user()?->id,
            ]);

            $warehouse = Room::query()
                ->where('is_storage', true)
                ->orderBy('id')
                ->first();

            $asset->update([
                'condition' => Asset::CONDITION_DAMAGED,
                'usage_status' => Asset::USAGE_IN_STORAGE,
                'room_id' => $warehouse?->id ?? $asset->room_id,
                'assigned_user_id' => null,
            ]);

            return $damage;
        });

        return ApiResponse::created([
            'damage' => new AssetDamageResource(
                $damage->load(['asset.room', 'asset.category', 'room', 'user', 'responsible', 'performedBy'])
            ),
        ], 'Damage report recorded. Asset marked as damaged and moved to storage.');
    }

    /**
     * Display the specified damage report.
     */
    public function show(AssetDamage $assetDamage): JsonResponse
    {
        return ApiResponse::success([
            'damage' => new AssetDamageResource(
                $assetDamage->load(['asset.room', 'asset.category', 'room', 'user', 'responsible', 'performedBy'])
            ),
        ]);
    }

    /**
     * Update the specified damage report.
     */
    public function update(UpdateAssetDamageRequest $request, AssetDamage $assetDamage): JsonResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('photo')) {
            if ($assetDamage->photo_path) {
                $oldPath = public_path($assetDamage->photo_path);
                if (File::exists($oldPath)) {
                    File::delete($oldPath);
                }
            }

            $file = $request->file('photo');
            $ext = strtolower($file->guessExtension() ?: 'bin');
            $name = 'damage_'.md5(uniqid((string) random_int(0, PHP_INT_MAX), true)).'.'.$ext;
            $file->move(public_path('uploads/damages'), $name);
            $validated['photo_path'] = 'uploads/damages/'.$name;
        }

        $assetDamage->update([
            'damage_date' => $validated['damage_date'],
            'user_id' => $validated['user_id'] ?? null,
            'responsible_id' => $validated['responsible_id'] ?? null,
            'description' => $validated['description'],
            'notes' => $validated['notes'] ?? null,
            'photo_path' => $validated['photo_path'] ?? $assetDamage->photo_path,
        ]);

        return ApiResponse::success([
            'damage' => new AssetDamageResource(
                $assetDamage->load(['asset.room', 'asset.category', 'room', 'user', 'responsible', 'performedBy'])
            ),
        ], 'Damage report updated successfully.');
    }

    /**
     * Remove the specified damage report and its photo file.
     */
    public function destroy(AssetDamage $assetDamage): JsonResponse
    {
        if ($assetDamage->photo_path) {
            $path = public_path($assetDamage->photo_path);
            if (File::exists($path)) {
                File::delete($path);
            }
        }

        $assetDamage->delete();

        return ApiResponse::noContent('Damage report deleted successfully.');
    }
}
