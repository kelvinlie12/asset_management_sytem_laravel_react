<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\Team;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Seed rooms and team assignments.
     */
    public function run(): void
    {
        $rooms = [
            [
                'name' => 'Ruang Rapat A',
                'location' => 'Lantai 1',
                'description' => 'Ruang rapat utama untuk meeting tim.',
                'status' => 'active',
                'is_storage' => false,
            ],
            [
                'name' => 'Ruang Rapat B',
                'location' => 'Lantai 1',
                'description' => 'Ruang rapat kecil untuk diskusi.',
                'status' => 'active',
                'is_storage' => false,
            ],
            [
                'name' => 'Server Room',
                'location' => 'Lantai 2',
                'description' => 'Ruang penyimpanan server dan perangkat jaringan.',
                'status' => 'active',
                'is_storage' => false,
            ],
            [
                'name' => 'Training Room',
                'location' => 'Lantai 3',
                'description' => 'Ruang pelatihan dan workshop.',
                'status' => 'inactive',
                'is_storage' => false,
            ],
            [
                'name' => 'Gudang',
                'location' => 'Gudang Lantai 1',
                'description' => 'Gudang / storage untuk penyimpanan barang (termasuk barang rusak).',
                'status' => 'active',
                'is_storage' => true,
            ],
        ];

        $roomModels = [];
        foreach ($rooms as $room) {
            $roomModels[] = Room::query()->updateOrCreate(
                ['name' => $room['name']],
                $room,
            );
        }

        // Link teams to the rooms they can use.
        $teamDevelopment = Team::query()->where('slug', 'development')->first();
        $teamMarketing = Team::query()->where('slug', 'marketing')->first();
        $teamOperations = Team::query()->where('slug', 'operations')->first();

        if ($teamDevelopment) {
            $teamDevelopment->rooms()->sync([$roomModels[0]->id, $roomModels[1]->id]);
        }
        if ($teamMarketing) {
            $teamMarketing->rooms()->sync([$roomModels[0]->id]);
        }
        if ($teamOperations) {
            $teamOperations->rooms()->sync([$roomModels[2]->id]);
        }
    }
}