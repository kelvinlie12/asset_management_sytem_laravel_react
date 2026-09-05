<?php

namespace App\Http\Requests;

use App\Models\Asset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAssetDamageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('damages.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'asset_id' => ['required', Rule::exists('assets', 'id')],
            'damage_date' => ['required', 'date'],
            'user_id' => ['nullable', Rule::exists('users', 'id')],
            'responsible_id' => ['nullable', Rule::exists('users', 'id')],
            'description' => ['required', 'string'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Apply additional damage domain rules.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $assetId = $validator->getData()['asset_id'] ?? null;
                if (! $assetId) {
                    return;
                }

                $asset = Asset::query()->find($assetId);
                if (! $asset) {
                    return;
                }

                if ($asset->condition === Asset::CONDITION_DAMAGED) {
                    $validator->errors()->add(
                        'asset_id',
                        'This asset is already reported as damaged (DAMAGED).'
                    );
                }
            },
        ];
    }
}
