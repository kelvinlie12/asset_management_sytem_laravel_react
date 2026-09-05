<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignRoomsToTeamRequest;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    /**
     * Display a paginated, searchable list of teams.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $teams = Team::query()
            ->withCount('users')
            ->with('rooms')
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->query('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(TeamResource::collection($teams)->response()->getData(true), 'Data tim berhasil dimuat.');
    }

    /**
     * Store a newly created team.
     */
    public function store(StoreTeamRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $team = Team::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? Team::STATUS_ACTIVE,
        ]);

        if (isset($validated['room_ids'])) {
            $team->rooms()->sync($validated['room_ids']);
        }

        return ApiResponse::created([
            'team' => new TeamResource($team->load('rooms')->loadCount('users')),
        ], 'Team created successfully.');
    }

    /**
     * Display the specified team.
     */
    public function show(Team $team): JsonResponse
    {
        return ApiResponse::success([
            'team' => new TeamResource($team->load('rooms')->loadCount('users')),
        ]);
    }

    /**
     * Update the specified team.
     */
    public function update(UpdateTeamRequest $request, Team $team): JsonResponse
    {
        $validated = $request->validated();

        if (isset($validated['room_ids'])) {
            $team->rooms()->sync($validated['room_ids']);
            unset($validated['room_ids']);
        }

        $team->update($validated);

        return ApiResponse::success([
            'team' => new TeamResource($team->fresh()->load('rooms')->loadCount('users')),
        ], 'Team updated successfully.');
    }

    /**
     * Remove the specified team.
     */
    public function destroy(Request $request, Team $team): JsonResponse
    {
        if ($team->users()->exists()) {
            return ApiResponse::error('Cannot delete a team that still has members.', ['team' => ['Tim masih memiliki anggota.']], 422);
        }

        $team->rooms()->detach();
        $team->delete();

        return ApiResponse::noContent('Team deleted successfully.');
    }

    /**
     * Assign rooms that the specified team can use.
     */
    public function assignRooms(AssignRoomsToTeamRequest $request, Team $team): JsonResponse
    {
        $team->rooms()->sync($request->validated('room_ids'));

        return ApiResponse::success([
            'team' => new TeamResource($team->fresh()->load('rooms')->loadCount('users')),
        ], 'Rooms assigned successfully.');
    }
}