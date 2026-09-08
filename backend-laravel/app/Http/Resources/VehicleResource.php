<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
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
            'asset_code' => $this->asset_code,
            'photo' => $this->photo,
            'photo_url' => $this->photo
                ? (filter_var($this->photo, FILTER_VALIDATE_URL) ? $this->photo : url($this->photo))
                : null,
            'brand' => $this->brand,
            'model' => $this->model,
            'plate_number' => $this->plate_number,
            'engine_number' => $this->engine_number,
            'chassis_number' => $this->chassis_number,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'purchase_price' => $this->purchase_price,
            'tax_due_date' => $this->tax_due_date?->format('Y-m-d'),
            'description' => $this->description,
            'condition' => $this->condition,
            'usage_status' => $this->usage_status,
            'team' => $this->whenLoaded('team', fn () => $this->team ? new TeamResource($this->team) : null),
            'room' => $this->whenLoaded('room', fn () => $this->room ? new RoomResource($this->room) : null),
            'assigned_user' => $this->whenLoaded('assignedUser', fn () => $this->assignedUser ? new UserResource($this->assignedUser) : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
