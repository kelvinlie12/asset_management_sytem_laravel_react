<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Log the user in and issue a Sanctum API token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! $user->isActive() || ! Hash::check($validated['password'], $user->password)) {
            return ApiResponse::error('The provided credentials are incorrect.', null, 401);
        }

        // Ensure the user's token abilities reflect their current role.
        $user->tokens()->delete();
        $user->syncRoleToSpatie();

        $token = $user->createToken(
            'auth-token',
            $user->getRoleAbilities()
        )->plainTextToken;

        return ApiResponse::success([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->profileArray($user),
        ], 'Login successful.');
    }

    /**
     * Log the user out and revoke the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::noContent('Logged out successfully.');
    }

    /**
     * Get the authenticated user's profile.
     */
    public function profile(Request $request): JsonResponse
    {
        return ApiResponse::success([
            'user' => $this->profileArray($request->user()),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:4096'],
        ]);

        $data = [
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
        ];

        if ($request->hasFile('avatar')) {
            $this->deleteAvatar($user->avatar);
            $data['avatar'] = $this->storeAvatar($request->file('avatar'));
        } elseif (array_key_exists('avatar', $validated) && $validated['avatar'] === null) {
            $this->deleteAvatar($user->avatar);
            $data['avatar'] = null;
        }

        $user->update($data);

        return ApiResponse::success([
            'user' => $this->profileArray($user->fresh()),
        ], 'Profile updated successfully.');
    }

    /**
     * Change the authenticated user's password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return ApiResponse::error('The current password is incorrect.', [
                'current_password' => ['The current password is incorrect.'],
            ], 422);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        // Optionally invalidate other tokens, keep the current session alive.
        $user->tokens()
            ->where('id', '!=', $user->currentAccessToken()->id)
            ->delete();

        return ApiResponse::noContent('Password changed successfully.');
    }

    /**
     * Build the user payload shared across auth endpoints, including avatar URL.
     *
     * @return array<string, mixed>
     */
    private function profileArray(User $user): array
    {
        $data = $user->toArray();

        $data['avatar'] = $user->avatar;
        $data['avatar_url'] = $user->avatar ? url($user->avatar) : null;

        return $data;
    }

    /**
     * Move an uploaded avatar into the public uploads directory.
     */
    private function storeAvatar($file): string
    {
        $ext = strtolower($file->guessExtension() ?: 'bin');
        $name = 'avatar_'.md5(uniqid((string) random_int(0, PHP_INT_MAX), true)).'.'.$ext;
        $file->move(public_path('uploads/avatars'), $name);

        return 'uploads/avatars/'.$name;
    }

    /**
     * Remove a stored avatar file if it exists under the public directory.
     */
    private function deleteAvatar(?string $path): void
    {
        if (! $path) {
            return;
        }
        $fullPath = public_path($path);
        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }
}
