<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Http\Resources\VehicleResource;
use App\Models\VehicleAsset;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    /**
     * Display a paginated, searchable list of vehicle assets.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $vehicles = VehicleAsset::query()
            ->with(['team', 'room', 'assignedUser'])
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('asset_code', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('plate_number', 'like', "%{$search}%")
                        ->orWhere('engine_number', 'like', "%{$search}%")
                        ->orWhere('chassis_number', 'like', "%{$search}%");
                });
            })
            ->when($request->query('condition'), function ($query, $condition) {
                $query->where('condition', $condition);
            })
            ->when($request->query('usage_status'), function ($query, $usageStatus) {
                $query->where('usage_status', $usageStatus);
            })
            ->when($request->query('team_id'), function ($query, $teamId) {
                $query->where('team_id', $teamId);
            })
            ->when($request->query('room_id'), function ($query, $roomId) {
                $query->where('room_id', $roomId);
            })
            ->when($request->query('tax_status'), function ($query, $taxStatus) {
                $today = now()->startOfDay();
                $inThirtyDays = $today->copy()->addDays(30);
                switch ($taxStatus) {
                    case 'overdue':
                        $query->whereNotNull('tax_due_date')->whereDate('tax_due_date', '<', $today);
                        break;
                    case 'due_soon':
                        $query->whereNotNull('tax_due_date')->whereDate('tax_due_date', '>=', $today)->whereDate('tax_due_date', '<=', $inThirtyDays);
                        break;
                    case 'safe':
                        $query->where(function ($q) use ($today, $inThirtyDays) {
                            $q->whereNull('tax_due_date')->orWhereDate('tax_due_date', '>', $inThirtyDays);
                        });
                        break;
                }
            })
            ->orderBy('asset_code')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(VehicleResource::collection($vehicles)->response()->getData(true), 'Data kendaraan berhasil dimuat.');
    }

    /**
     * Store a newly created vehicle asset.
     */
    public function store(StoreVehicleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (empty($validated['asset_code'])) {
            $validated['asset_code'] = $this->nextVehicleCode();
        }

        $vehicle = VehicleAsset::create($validated);

        return ApiResponse::created([
            'vehicle' => new VehicleResource($vehicle->load(['team', 'room', 'assignedUser'])),
        ], 'Vehicle asset created successfully.');
    }

    /**
     * Display the specified vehicle asset.
     */
    public function show(VehicleAsset $vehicle): JsonResponse
    {
        return ApiResponse::success([
            'vehicle' => new VehicleResource($vehicle->load(['team', 'room', 'assignedUser'])),
        ]);
    }

    /**
     * Update the specified vehicle asset.
     */
    public function update(UpdateVehicleRequest $request, VehicleAsset $vehicle): JsonResponse
    {
        $vehicle->update($request->validated());

        return ApiResponse::success([
            'vehicle' => new VehicleResource($vehicle->fresh()->load(['team', 'room', 'assignedUser'])),
        ], 'Vehicle asset updated successfully.');
    }

    /**
     * Remove the specified vehicle asset.
     */
    public function destroy(Request $request, VehicleAsset $vehicle): JsonResponse
    {
        $vehicle->delete();

        return ApiResponse::noContent('Vehicle asset deleted successfully.');
    }

    /**
     * Generate the next sequential vehicle code (e.g. VHC-007).
     */
    private function nextVehicleCode(): string
    {
        $max = 0;
        foreach (VehicleAsset::query()->pluck('asset_code') as $code) {
            if (is_string($code) && preg_match('/^VHC-(\d+)$/', $code, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }

        do {
            $code = 'VHC-'.str_pad(++$max, 3, '0', STR_PAD_LEFT);
        } while (VehicleAsset::query()->where('asset_code', $code)->exists());

        return $code;
    }
}
