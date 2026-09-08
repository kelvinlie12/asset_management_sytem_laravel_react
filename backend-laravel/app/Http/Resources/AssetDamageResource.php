<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetDamageResource extends JsonResource
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
            'damage_date' => $this->damage_date?->format('Y-m-d'),
            'description' => $this->description,
            'photo_path' => $this->photo_path,
            'photo_url' => $this->photo_path ? url($this->photo_path) : null,
            'notes' => $this->notes,
            'asset' => $this->whenLoaded('asset', fn () => $this->asset ? new AssetResource($this->asset) : null),
            'room' => $this->whenLoaded('room', fn () => $this->room ? new RoomResource($this->room) : null),
            'user' => $this->whenLoaded('user', fn () => $this->user ? new UserResource($this->user) : null),
            'responsible' => $this->whenLoaded('responsible', fn () => $this->responsible ? new UserResource($this->responsible) : null),
            'performed_by' => $this->whenLoaded('performedBy', fn () => $this->performedBy ? new UserResource($this->performedBy) : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
