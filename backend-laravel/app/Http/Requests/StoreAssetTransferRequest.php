<?php

namespace App\Http\Requests;

use App\Models\Asset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAssetTransferRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('transfers.create');
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
            'transfer_date' => ['required', 'date'],
            'to_team_id' => ['nullable', Rule::exists('teams', 'id')],
            'to_room_id' => ['nullable', Rule::exists('rooms', 'id')],
            'to_user_id' => ['nullable', Rule::exists('users', 'id')],
            'reason' => ['nullable', 'string'],
        ];
    }

    /**
     * Apply additional transfer domain rules.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $data = $validator->getData();

                if (! isset($data['asset_id'])) {
                    return;
                }

                $asset = Asset::query()->find($data['asset_id']);
                if (! $asset) {
                    return;
                }

                if (! isset($data['to_team_id']) && ! isset($data['to_room_id']) && ! isset($data['to_user_id'])) {
                    $validator->errors()->add(
                        'targets',
                        'Specify at least one transfer target: a team, a room, or a user.'
                    );
                    return;
                }

                $current = [
                    ($asset->team_id ?? 0),
                    ($asset->room_id ?? 0),
                    ($asset->assigned_user_id ?? 0),
                ];
                $new = [
                    (int) ($data['to_team_id'] ?? 0),
                    (int) ($data['to_room_id'] ?? 0),
                    (int) ($data['to_user_id'] ?? 0),
                ];

                // Only the provided fields are considered actionable.
                $unchanged = true;
                $passed = [];
                if (array_key_exists('to_team_id', $data)) { $passed[] = $new[0]; }
                if (array_key_exists('to_room_id', $data)) { $passed[] = $new[1]; }
                if (array_key_exists('to_user_id', $data)) { $passed[] = $new[2]; }
                foreach ($passed as $i => $value) {
                    if ($value !== $current[$i]) { $unchanged = false; }
                }
                if ($unchanged) {
                    $validator->errors()->add(
                        'targets',
                        'The transfer targets match the current placement. Nothing to transfer.'
                    );
                }
            },
        ];
    }
}