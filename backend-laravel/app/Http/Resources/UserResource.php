<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'avatar_url' => $this->avatar ? url($this->avatar) : null,
            'phone' => $this->phone,
            'role' => $this->role,
            'role_label' => ucwords(str_replace('_', ' ', $this->role)),
            'status' => $this->status,
            'team' => $this->whenLoaded('team', fn () => new TeamResource($this->team)),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
