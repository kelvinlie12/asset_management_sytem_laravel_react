<?php

namespace App\Http\Requests;

use App\Models\VehicleAsset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreVehicleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('vehicles.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'asset_code' => ['required', 'string', 'max:50', 'unique:vehicle_assets,asset_code'],
            'photo' => ['nullable', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:255'],
            'model' => ['required', 'string', 'max:255'],
            'plate_number' => ['required', 'string', 'max:20', 'regex:/^[A-Z]{1,2}[ ]?\d{1,4}[ ]?[A-Z]{1,3}$/', 'unique:vehicle_assets,plate_number'],
            'engine_number' => ['nullable', 'string', 'max:255'],
            'chassis_number' => ['nullable', 'string', 'max:255'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'tax_due_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'condition' => ['required', Rule::in(VehicleAsset::CONDITIONS)],
            'usage_status' => ['required', Rule::in(VehicleAsset::USAGE_STATUSES)],
            'team_id' => ['nullable', Rule::exists('teams', 'id')],
            'room_id' => ['nullable', Rule::exists('rooms', 'id')],
            'assigned_user_id' => ['nullable', Rule::exists('users', 'id')],
        ];
    }

    /**
     * Apply additional domain rules: tax due date and damaged storage.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $data = $validator->getData();

            $purchaseDate = $data['purchase_date'] ?? null;
            $taxDueDate = $data['tax_due_date'] ?? null;
            if ($purchaseDate && $taxDueDate && $taxDueDate < $purchaseDate) {
                $validator->errors()->add(
                    'tax_due_date',
                    'The tax due date cannot be before the purchase date.'
                );
            }

            if (($data['condition'] ?? null) === VehicleAsset::CONDITION_DAMAGED
                && ($data['usage_status'] ?? null) !== VehicleAsset::USAGE_IN_STORAGE) {
                $validator->errors()->add(
                    'usage_status',
                    'A damaged vehicle must be stored (usage status IN_STORAGE).'
                );
            }
        });
    }
}
