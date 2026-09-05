<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetTransferResource extends JsonResource
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
            'transfer_date' => $this->transfer_date?->format('Y-m-d'),
            'reason' => $this->reason,
            'asset' => $this->whenLoaded('asset', fn () => $this->asset ? new AssetResource($this->asset) : null),
            'from_team' => $this->whenLoaded('fromTeam', fn () => $this->fromTeam ? new TeamResource($this->fromTeam) : null),
            'to_team' => $this->whenLoaded('toTeam', fn () => $this->toTeam ? new TeamResource($this->toTeam) : null),
            'from_room' => $this->whenLoaded('fromRoom', fn () => $this->fromRoom ? new RoomResource($this->fromRoom) : null),
            'to_room' => $this->whenLoaded('toRoom', fn () => $this->toRoom ? new RoomResource($this->toRoom) : null),
            'from_user' => $this->whenLoaded('fromUser', fn () => $this->fromUser ? new UserResource($this->fromUser) : null),
            'to_user' => $this->whenLoaded('toUser', fn () => $this->toUser ? new UserResource($this->toUser) : null),
            'performed_by' => $this->whenLoaded('performedBy', fn () => $this->performedBy ? new UserResource($this->performedBy) : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}