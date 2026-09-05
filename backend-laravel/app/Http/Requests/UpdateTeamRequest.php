<?php

namespace App\Http\Requests;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('teams.update');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $team = $this->route('team');

        return [
            'name' => ['sometimes', 'string', 'max:255', 'unique:teams,name,'.$team->id],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', Rule::in(Team::STATUSES)],
            'room_ids' => ['sometimes', 'array'],
            'room_ids.*' => ['integer', 'exists:rooms,id'],
        ];
    }
}