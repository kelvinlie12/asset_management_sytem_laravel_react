<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * The role rank (higher = more privileged).
     */
    private const ROLE_RANK = [
        User::ROLE_VIEWER => 1,
        User::ROLE_STAFF => 2,
        User::ROLE_ADMIN => 3,
        User::ROLE_SUPER_ADMIN => 4,
    ];

    private function canManage(User $user): bool
    {
        return $user->hasPermissionTo('user.manage');
    }

    /**
     * Determine whether the user can view the list of users.
     */
    public function viewAny(User $user): bool
    {
        return $this->canManage($user);
    }

    /**
     * Determine whether the user can view a specific user.
     */
    public function view(User $user, User $model): bool
    {
        return $this->canManage($user) || $user->id === $model->id;
    }

    /**
     * Determine whether the user can create users.
     */
    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    /**
     * Determine whether the user can update a user.
     */
    public function update(User $user, User $model): bool
    {
        if (! $this->canManage($user)) {
            return false;
        }

        // A user cannot change their own role/status.
        if ($user->id === $model->id) {
            return false;
        }

        // A non-super-admin cannot manage super admins or other admins.
        if (! $user->isSuperAdmin() && in_array($model->role, [User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN], true)) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can delete a user.
     */
    public function delete(User $user, User $model): bool
    {
        if (! $this->canManage($user)) {
            return false;
        }

        // Cannot delete yourself.
        if ($user->id === $model->id) {
            return false;
        }

        // Only a super admin can delete any user; admins can only delete lower ranks.
        if ($user->isSuperAdmin()) {
            return true;
        }

        return self::ROLE_RANK[$model->role] < self::ROLE_RANK[$user->role];
    }

    /**
     * Determine whether the user can assign a role to a user.
     */
    public function assignRole(User $user, User $model): bool
    {
        return $this->update($user, $model);
    }

    /**
     * Determine whether the user can assign a team to a user.
     */
    public function assignTeam(User $user, User $model): bool
    {
        if (! $this->canManage($user)) {
            return false;
        }

        return $user->id !== $model->id;
    }

    /**
     * Determine whether the user can reset a user's password.
     */
    public function resetPassword(User $user, User $model): bool
    {
        return $this->update($user, $model);
    }

    /**
     * Determine whether the user can deactivate/activate a user.
     */
    public function toggleStatus(User $user, User $model): bool
    {
        return $this->update($user, $model);
    }

    /**
     * Determine whether the user can deactivate a user.
     */
    public function deactivate(User $user, User $model): bool
    {
        return $this->toggleStatus($user, $model);
    }

    /**
     * Determine whether the user can activate a user.
     */
    public function activate(User $user, User $model): bool
    {
        return $this->toggleStatus($user, $model);
    }
}
