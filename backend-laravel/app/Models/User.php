<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_STAFF = 'staff';
    public const ROLE_VIEWER = 'viewer';

    public const ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_ADMIN,
        self::ROLE_STAFF,
        self::ROLE_VIEWER,
    ];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
    ];

    /**
     * Permission map for each role.
     *
     * @var array<string, list<string>>
     */
    public const ROLE_PERMISSIONS = [
        self::ROLE_VIEWER => [
            'profile.view',
        ],
        self::ROLE_STAFF => [
            'profile.view',
            'profile.update',
            'profile.password',
        ],
        self::ROLE_ADMIN => [
            'profile.view',
            'profile.update',
            'profile.password',
            'user.manage',
        ],
        self::ROLE_SUPER_ADMIN => [
            'profile.view',
            'profile.update',
            'profile.password',
            'user.manage',
            'system.manage',
        ],
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'avatar',
        'password',
        'role',
        'phone',
        'team_id',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN], true);
    }

    public function isStaff(): bool
    {
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_STAFF], true);
    }

    /**
     * Ensure the user's Spatie role matches the legacy `role` column.
     *
     * Creates the Spatie role if it does not yet exist, then reassigns it.
     */
    public function syncRoleToSpatie(): void
    {
        $roleName = $this->role ?: self::ROLE_VIEWER;
        $role = \Spatie\Permission\Models\Role::findOrCreate($roleName, 'web');

        if (! $this->hasRole($roleName)) {
            $this->syncRoles([$role]);
        }
    }

    /**
     * List of permissions granted to the user through Spatie.
     *
     * @return list<string>
     */
    public function getRoleAbilities(): array
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * The team that the user belongs to.
     *
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
