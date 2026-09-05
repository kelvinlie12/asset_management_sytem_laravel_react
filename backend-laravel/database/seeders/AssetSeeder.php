<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Category;
use App\Models\Room;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class AssetSeeder extends Seeder
{
    /**
     * Seed assets with their categories, locations, teams, and assignments.
     */
    public function run(): void
    {
        $room = fn (string $name) => Room::query()->where('name', $name)->first()?->id;
        $categoryCode = fn (string $code) => Category::query()->where('code', $code)->first()?->id;
        $team = fn (string $slug) => Team::query()->where('slug', $slug)->first()?->id;
        $marketingUser = User::query()->where('email', 'staff@example.com')->first()?->id;

        $assets = [
            [
                'asset_code' => 'AST-001',
                'name' => 'Proyektor Epson',
                'category_id' => $categoryCode('CAT-ELE'),
                'room_id' => $room('Ruang Rapat A'),
                'purchase_price' => 4500000,
                'purchase_date' => '2024-01-15',
                'purchase_receipt' => 'RCPT-0001',
                'description' => 'Proyektor untuk ruang rapat.',
                'condition' => 'GOOD',
                'usage_status' => 'IN_STORAGE',
            ],
            [
                'asset_code' => 'AST-002',
                'name' => 'TV 55 Inch',
                'category_id' => $categoryCode('CAT-ELE'),
                'room_id' => $room('Ruang Rapat A'),
                'purchase_price' => 7200000,
                'purchase_date' => '2024-02-20',
                'purchase_receipt' => 'RCPT-0002',
                'description' => 'Layar untuk presentasi.',
                'condition' => 'GOOD',
                'usage_status' => 'IN_STORAGE',
            ],
            [
                'asset_code' => 'AST-003',
                'name' => 'Server Rack',
                'category_id' => $categoryCode('CAT-IT'),
                'room_id' => $room('Server Room'),
                'purchase_price' => 12500000,
                'purchase_date' => '2023-11-30',
                'purchase_receipt' => 'RCPT-0003',
                'description' => 'Rak server utama.',
                'condition' => 'GOOD',
                'usage_status' => 'IN_STORAGE',
            ],
            [
                'asset_code' => 'AST-004',
                'name' => 'Laptop Dell Latitude',
                'category_id' => $categoryCode('CAT-IT'),
                'team_id' => $team('development'),
                'room_id' => $room('Ruang Rapat B'),
                'assigned_user_id' => $marketingUser,
                'purchase_price' => 15900000,
                'purchase_date' => '2025-03-10',
                'purchase_receipt' => 'RCPT-0004',
                'description' => 'Laptop kerja tim pengembangan.',
                'condition' => 'GOOD',
                'usage_status' => 'IN_USE',
            ],
            [
                'asset_code' => 'AST-005',
                'name' => 'Kursi Kantor Rusak',
                'category_id' => $categoryCode('CAT-FUR'),
                'room_id' => $room('Gudang'),
                'purchase_price' => 850000,
                'purchase_date' => '2022-05-10',
                'purchase_receipt' => 'RCPT-0005',
                'description' => 'Kursi kantor dengan kerusakan pada roda.',
                'condition' => 'DAMAGED',
                'usage_status' => 'IN_STORAGE',
            ],
            [
                'asset_code' => 'AST-006',
                'name' => 'Monitor LG 27 Inch',
                'category_id' => $categoryCode('CAT-ELE'),
                'room_id' => $room('Gudang'),
                'purchase_price' => 2900000,
                'purchase_date' => '2024-08-05',
                'purchase_receipt' => 'RCPT-0006',
                'description' => 'Monitor cadangan untuk stok.',
                'condition' => 'GOOD',
                'usage_status' => 'IN_STORAGE',
            ],
        ];

        foreach ($assets as $asset) {
            Asset::query()->updateOrCreate(
                ['asset_code' => $asset['asset_code']],
                $asset,
            );
        }
    }
}