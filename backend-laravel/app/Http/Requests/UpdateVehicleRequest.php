<?php

namespace App\Http\Requests;

use App\Models\VehicleAsset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateVehicleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('vehicles.update');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $vehicle = $this->route('vehicle');

        return [
            'asset_code' => ['sometimes', 'string', 'max:50', 'unique:vehicle_assets,asset_code,'.$vehicle->id],
            'photo' => ['sometimes', 'nullable', 'string', 'max:255'],
            'brand' => ['sometimes', 'string', 'max:255'],
            'model' => ['sometimes', 'string', 'max:255'],
            'plate_number' => ['sometimes', 'string', 'max:20', 'regex:/^[A-Z]{1,2}[ ]?\d{1,4}[ ]?[A-Z]{1,3}$/', 'unique:vehicle_assets,plate_number,'.$vehicle->id],
            'engine_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'chassis_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'purchase_date' => ['sometimes', 'nullable', 'date'],
            'purchase_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'tax_due_date' => ['sometimes', 'nullable', 'date'],
            'description' => ['sometimes', 'nullable', 'string'],
            'condition' => ['sometimes', Rule::in(VehicleAsset::CONDITIONS)],
            'usage_status' => ['sometimes', Rule::in(VehicleAsset::USAGE_STATUSES)],
            'team_id' => ['sometimes', 'nullable', Rule::exists('teams', 'id')],
            'room_id' => ['sometimes', 'nullable', Rule::exists('rooms', 'id')],
            'assigned_user_id' => ['sometimes', 'nullable', Rule::exists('users', 'id')],
        ];
    }

    /**
     * Apply additional domain rules: tax due date and damaged storage.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $vehicle = $this->route('vehicle');
            $data = $validator->getData();

            $purchaseDate = $data['purchase_date'] ?? ($vehicle->purchase_date?->format('Y-m-d') ?? null);
            $taxDueDate = $data['tax_due_date'] ?? ($vehicle->tax_due_date?->format('Y-m-d') ?? null);
            if ($purchaseDate && $taxDueDate && $taxDueDate < $purchaseDate) {
                $validator->errors()->add(
                    'tax_due_date',
                    'The tax due date cannot be before the purchase date.'
                );
            }

            $condition = $data['condition'] ?? $vehicle->condition;
            $usageStatus = $data['usage_status'] ?? $vehicle->usage_status;
            if ($condition === VehicleAsset::CONDITION_DAMAGED
                && $usageStatus !== VehicleAsset::USAGE_IN_STORAGE) {
                $validator->errors()->add(
                    'usage_status',
                    'A damaged vehicle must be stored (usage status IN_STORAGE).'
                );
            }
        });
    }
}
