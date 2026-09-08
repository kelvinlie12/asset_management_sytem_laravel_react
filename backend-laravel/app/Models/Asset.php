<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    use HasFactory;

    public const CONDITION_GOOD = 'GOOD';
    public const CONDITION_DAMAGED = 'DAMAGED';

    public const CONDITIONS = [
        self::CONDITION_GOOD,
        self::CONDITION_DAMAGED,
    ];

    public const USAGE_IN_USE = 'IN_USE';
    public const USAGE_IN_STORAGE = 'IN_STORAGE';

    public const USAGE_STATUSES = [
        self::USAGE_IN_USE,
        self::USAGE_IN_STORAGE,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'asset_code',
        'name',
        'category_id',
        'photo',
        'purchase_price',
        'purchase_date',
        'placement_date',
        'purchase_receipt',
        'description',
        'condition',
        'usage_status',
        'team_id',
        'room_id',
        'assigned_user_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'purchase_date' => 'date',
            'placement_date' => 'date',
        ];
    }

    /**
     * The room that this asset belongs to.
     *
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * The category that this asset belongs to.
     *
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * The team that this asset is assigned to.
     *
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * The user this asset is assigned to.
     *
     * @return BelongsTo<User, $this>
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /**
     * Purchase history for this asset.
     *
     * @return HasMany<Purchase, $this>
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * Placement (assignment) history for this asset.
     *
     * @return HasMany<AssetAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class);
    }

    /**
     * Transfer (mutation) history for this asset.
     *
     * @return HasMany<AssetTransfer, $this>
     */
    public function transfers(): HasMany
    {
        return $this->hasMany(AssetTransfer::class);
    }

    /**
     * Damage report history for this asset.
     *
     * @return HasMany<AssetDamage, $this>
     */
    public function damages(): HasMany
    {
        return $this->hasMany(AssetDamage::class);
    }
}