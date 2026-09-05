<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
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
            'purchase_number' => $this->purchase_number,
            'supplier' => $this->supplier,
            'invoice_number' => $this->invoice_number,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'amount' => $this->amount,
            'notes' => $this->notes,
            'proof_path' => $this->proof_path,
            'proof_url' => $this->proof_path ? url($this->proof_path) : null,
            'asset' => $this->whenLoaded('asset', fn () => $this->asset ? new AssetResource($this->asset) : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}