<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('categories.update');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $category = $this->route('category');

        return [
            'name' => ['sometimes', 'string', 'max:255', 'unique:categories,name,'.$category->id],
            'code' => ['sometimes', 'string', 'max:50', 'unique:categories,code,'.$category->id],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', Rule::in(Category::STATUSES)],
        ];
    }
}