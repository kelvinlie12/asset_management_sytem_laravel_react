<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetTransfer extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'asset_id',
        'transfer_date',
        'from_team_id',
        'to_team_id',
        'from_room_id',
        'to_room_id',
        'from_user_id',
        'to_user_id',
        'reason',
        'performed_by_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'transfer_date' => 'date',
        ];
    }

    /**
     * The asset that was transferred.
     *
     * @return BelongsTo<Asset, $this>
     */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    /**
     * The team the asset was moved from.
     *
     * @return BelongsTo<Team, $this>
     */
    public function fromTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'from_team_id');
    }

    /**
     * The team the asset was moved to.
     *
     * @return BelongsTo<Team, $this>
     */
    public function toTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'to_team_id');
    }

    /**
     * The room the asset was moved from.
     *
     * @return BelongsTo<Room, $this>
     */
    public function fromRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'from_room_id');
    }

    /**
     * The room the asset was moved to.
     *
     * @return BelongsTo<Room, $this>
     */
    public function toRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'to_room_id');
    }

    /**
     * The user the asset was moved from.
     *
     * @return BelongsTo<User, $this>
     */
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    /**
     * The user the asset was moved to.
     *
     * @return BelongsTo<User, $this>
     */
    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    /**
     * The user who performed the transfer.
     *
     * @return BelongsTo<User, $this>
     */
    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_id');
    }
}