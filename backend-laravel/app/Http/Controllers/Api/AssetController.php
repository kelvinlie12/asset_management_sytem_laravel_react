<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;
use App\Http\Resources\AssetResource;
use App\Models\Asset;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class AssetController extends Controller
{
    /**
     * Display a paginated, searchable list of assets.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $assets = Asset::query()
            ->with(['room', 'category', 'team', 'assignedUser'])
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('asset_code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->query('condition'), function ($query, $condition) {
                $query->where('condition', $condition);
            })
            ->when($request->query('usage_status'), function ($query, $usageStatus) {
                $query->where('usage_status', $usageStatus);
            })
            ->when($request->query('category_id'), function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($request->query('room_id'), function ($query, $roomId) {
                $query->where('room_id', $roomId);
            })
            ->when($request->query('team_id'), function ($query, $teamId) {
                $query->where('team_id', $teamId);
            })
            ->when($request->query('assigned_user_id'), function ($query, $userId) {
                $query->where('assigned_user_id', $userId);
            })
            ->orderBy('asset_code')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(AssetResource::collection($assets)->response()->getData(true), 'Data asset berhasil dimuat.');
    }

    /**
     * Store a newly created asset.
     */
    public function store(StoreAssetRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $data['photo'] = $this->storeFile($request->file('photo'), 'uploads/assets/photos');
        }
        if ($request->hasFile('purchase_receipt')) {
            $data['purchase_receipt'] = $this->storeFile($request->file('purchase_receipt'), 'uploads/assets/receipts');
        }

        $asset = Asset::create($data);

        return ApiResponse::created([
            'asset' => new AssetResource($asset->load($this->relations())),
        ], 'Asset created successfully.');
    }

    /**
     * Display the specified asset with its full history.
     */
    public function show(Asset $asset): JsonResponse
    {
        return ApiResponse::success([
            'asset' => new AssetResource($asset->load($this->relations())),
        ]);
    }

    /**
     * Update the specified asset.
     */
    public function update(UpdateAssetRequest $request, Asset $asset): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $this->deleteFile($asset->photo);
            $data['photo'] = $this->storeFile($request->file('photo'), 'uploads/assets/photos');
        }
        if ($request->hasFile('purchase_receipt')) {
            $this->deleteFile($asset->purchase_receipt);
            $data['purchase_receipt'] = $this->storeFile($request->file('purchase_receipt'), 'uploads/assets/receipts');
        }

        $asset->update($data);

        return ApiResponse::success([
            'asset' => new AssetResource($asset->fresh()->load($this->relations())),
        ], 'Asset updated successfully.');
    }

    /**
     * Remove the specified asset.
     */
    public function destroy(Request $request, Asset $asset): JsonResponse
    {
        $this->deleteFile($asset->photo);
        $this->deleteFile($asset->purchase_receipt);

        $asset->delete();

        return ApiResponse::noContent('Asset deleted successfully.');
    }

    /**
     * Eager-loaded relations used for asset resources with history.
     */
    private function relations(): array
    {
        return [
            'room',
            'category',
            'team',
            'assignedUser',
            'purchases',
            'assignments',
            'transfers',
            'damages',
        ];
    }

    /**
     * Move an uploaded file into the public uploads directory.
     */
    private function storeFile($file, string $directory): string
    {
        $ext = strtolower($file->guessExtension() ?: 'bin');
        $name = 'asset_'.md5(uniqid((string) random_int(0, PHP_INT_MAX), true)).'.'.$ext;
        $file->move(public_path($directory), $name);

        return $directory.'/'.$name;
    }

    /**
     * Remove a stored file if it exists under the public directory.
     */
    private function deleteFile(?string $path): void
    {
        if (! $path) {
            return;
        }
        $fullPath = public_path($path);
        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }
}
