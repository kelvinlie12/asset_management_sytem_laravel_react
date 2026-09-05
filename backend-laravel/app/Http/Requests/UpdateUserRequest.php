<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('user'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['sometimes', Rule::in(User::ROLES)],
            'team_id' => ['sometimes', 'nullable', 'integer', 'exists:teams,id'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'status' => ['sometimes', Rule::in(User::STATUSES)],
            'password' => ['sometimes', 'nullable', Password::min(8)],
        ];
    }
}
