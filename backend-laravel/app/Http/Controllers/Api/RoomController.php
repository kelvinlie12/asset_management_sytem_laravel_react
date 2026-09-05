<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    /**
     * Display a paginated, searchable list of rooms.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $rooms = Room::query()
            ->withCount('assets')
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->query('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(RoomResource::collection($rooms)->response()->getData(true), 'Data ruangan berhasil dimuat.');
    }

    /**
     * Store a newly created room.
     */
    public function store(StoreRoomRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $room = Room::create([
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? Room::STATUS_ACTIVE,
        ]);

        return ApiResponse::created([
            'room' => new RoomResource($room->loadCount('assets')),
        ], 'Room created successfully.');
    }

    /**
     * Display the specified room.
     */
    public function show(Room $room): JsonResponse
    {
        return ApiResponse::success([
            'room' => new RoomResource($room->load('teams')->loadCount('assets')),
        ]);
    }

    /**
     * Update the specified room.
     */
    public function update(UpdateRoomRequest $request, Room $room): JsonResponse
    {
        $room->update($request->validated());

        return ApiResponse::success([
            'room' => new RoomResource($room->fresh()->loadCount('assets')),
        ], 'Room updated successfully.');
    }

    /**
     * Remove the specified room.
     */
    public function destroy(Request $request, Room $room): JsonResponse
    {
        if ($room->assets()->exists()) {
            return ApiResponse::error('Cannot delete a room that still has assets.', ['room' => ['Ruangan masih memiliki aset.']], 422);
        }

        $room->teams()->detach();
        $room->delete();

        return ApiResponse::noContent('Room deleted successfully.');
    }
}