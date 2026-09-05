<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetAssignmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'assigned_date' => $this->assigned_date?->format('Y-m-d'),
            'notes' => $this->notes,
            'asset' => $this->whenLoaded('asset', fn () => $this->asset ? new AssetResource($this->asset) : null),
            'team' => $this->whenLoaded('team', fn () => $this->team ? new TeamResource($this->team) : null),
            'room' => $this->whenLoaded('room', fn () => $this->room ? new RoomResource($this->room) : null),
            'assigned_user' => $this->whenLoaded('assignedUser', fn () => $this->assignedUser ? new UserResource($this->assignedUser) : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}