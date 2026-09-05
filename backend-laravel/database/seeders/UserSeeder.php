<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed teams and users for each role.
     */
    public function run(): void
    {
        $teams = [
            [
                'name' => 'Development',
                'slug' => 'development',
                'description' => 'Tim pengembangan produk dan sistem.',
                'status' => 'active',
            ],
            [
                'name' => 'Marketing',
                'slug' => 'marketing',
                'description' => 'Tim pemasaran dan komunikasi.',
                'status' => 'active',
            ],
            [
                'name' => 'Operations',
                'slug' => 'operations',
                'description' => 'Tim operasional harian perusahaan.',
                'status' => 'active',
            ],
            [
                'name' => 'Finance',
                'slug' => 'finance',
                'description' => 'Tim keuangan dan akuntansi.',
                'status' => 'active',
            ],
        ];

        $teamModels = [];
        foreach ($teams as $team) {
            $teamModels[] = Team::query()->firstOrCreate(['slug' => $team['slug']], $team);
        }

        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@example.com',
                'password' => 'password',
                'role' => User::ROLE_SUPER_ADMIN,
                'team_id' => $teamModels[0]->id,
            ],
            [
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => 'password',
                'role' => User::ROLE_ADMIN,
                'team_id' => $teamModels[0]->id,
            ],
            [
                'name' => 'Staff User',
                'email' => 'staff@example.com',
                'password' => 'password',
                'role' => User::ROLE_STAFF,
                'team_id' => $teamModels[1]->id,
            ],
            [
                'name' => 'Viewer User',
                'email' => 'viewer@example.com',
                'password' => 'password',
                'role' => User::ROLE_VIEWER,
                'team_id' => $teamModels[2]->id,
            ],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                $user,
            );
        }
    }
}
