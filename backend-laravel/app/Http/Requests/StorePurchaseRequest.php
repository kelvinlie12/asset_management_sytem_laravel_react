<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('purchases.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', Rule::exists('categories', 'id')],
            'room_id' => ['nullable', Rule::exists('rooms', 'id')],
            'amount' => ['required', 'numeric', 'min:0'],
            'purchase_date' => ['required', 'date'],
            'supplier' => ['required', 'string', 'max:255'],
            'invoice_number' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }
}