<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleAsset extends Model
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
        'photo',
        'brand',
        'model',
        'plate_number',
        'engine_number',
        'chassis_number',
        'purchase_date',
        'purchase_price',
        'tax_due_date',
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
            'tax_due_date' => 'date',
        ];
    }

    /**
     * The team this vehicle is assigned to.
     *
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * The room this vehicle is stored in.
     *
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * The user this vehicle is assigned to.
     *
     * @return BelongsTo<User, $this>
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }
}
