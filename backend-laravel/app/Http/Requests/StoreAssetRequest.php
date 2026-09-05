<?php

namespace App\Http\Requests;

use App\Models\Asset;
use App\Models\Room;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAssetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('assets.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'asset_code' => ['required', 'string', 'max:50', 'unique:assets,asset_code'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', Rule::exists('categories', 'id')],
            'photo' => ['nullable', 'file', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:8192'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_receipt' => ['nullable', 'file', 'mimes:jpeg,png,jpg,gif,webp,pdf,doc,docx', 'max:8192'],
            'description' => ['nullable', 'string'],
            'condition' => ['required', Rule::in(Asset::CONDITIONS)],
            'usage_status' => ['required', Rule::in(Asset::USAGE_STATUSES)],
            'team_id' => ['nullable', Rule::exists('teams', 'id')],
            'room_id' => ['nullable', Rule::exists('rooms', 'id')],
            'assigned_user_id' => ['nullable', Rule::exists('users', 'id')],
        ];
    }

    /**
     * Enforce the business rule: a damaged asset must be stored in a warehouse.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $data = $validator->getData();
            $condition = $data['condition'] ?? null;

            if ($condition !== Asset::CONDITION_DAMAGED) {
                return;
            }

            if (($data['usage_status'] ?? null) !== Asset::USAGE_IN_STORAGE) {
                $validator->errors()->add(
                    'usage_status',
                    'A damaged asset must be stored in the warehouse (usage status IN_STORAGE).',
                );
            }

            $roomId = $data['room_id'] ?? null;
            if ($roomId && ! Room::query()->where('id', $roomId)->where('is_storage', true)->exists()) {
                $validator->errors()->add(
                    'room_id',
                    'A damaged asset must be assigned to a storage room (warehouse).',
                );
            }
        });
    }
}