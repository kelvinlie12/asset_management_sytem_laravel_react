<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
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
            'name' => $this->name,
            'category' => $this->whenLoaded('category', fn () => $this->category ? new CategoryResource($this->category) : null),
            'photo' => $this->photo,
            'photo_url' => $this->photo ? url($this->photo) : null,
            'purchase_price' => $this->purchase_price,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'purchase_receipt' => $this->purchase_receipt,
            'purchase_receipt_url' => $this->purchase_receipt ? url($this->purchase_receipt) : null,
            'description' => $this->description,
            'condition' => $this->condition,
            'usage_status' => $this->usage_status,
            'team' => $this->whenLoaded('team', fn () => $this->team ? new TeamResource($this->team) : null),
            'room' => $this->whenLoaded('room', fn () => $this->room ? new RoomResource($this->room) : null),
            'assigned_user' => $this->whenLoaded('assignedUser', fn () => $this->assignedUser ? new UserResource($this->assignedUser) : null),
            'purchases' => PurchaseResource::collection($this->whenLoaded('purchases')),
            'assignments' => AssetAssignmentResource::collection($this->whenLoaded('assignments')),
            'transfers' => AssetTransferResource::collection($this->whenLoaded('transfers')),
            'damages' => AssetDamageResource::collection($this->whenLoaded('damages')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}