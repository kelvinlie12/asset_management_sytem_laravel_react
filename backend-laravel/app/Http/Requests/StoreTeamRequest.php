<?php

namespace App\Http\Requests;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('teams.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:teams,name'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(Team::STATUSES)],
            'room_ids' => ['sometimes', 'array'],
            'room_ids.*' => ['integer', 'exists:rooms,id'],
        ];
    }
}