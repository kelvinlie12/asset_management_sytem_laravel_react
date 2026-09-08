<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssetDamageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('damages.update');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'damage_date' => ['required', 'date'],
            'user_id' => ['nullable', Rule::exists('users', 'id')],
            'responsible_id' => ['nullable', Rule::exists('users', 'id')],
            'description' => ['required', 'string'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'notes' => ['nullable', 'string'],
        ];
    }
}