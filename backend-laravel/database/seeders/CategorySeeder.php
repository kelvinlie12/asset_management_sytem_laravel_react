<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Seed asset categories.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Elektronik',
                'code' => 'CAT-ELE',
                'description' => 'Barang elektronik dan perangkat listrik.',
                'status' => 'active',
            ],
            [
                'name' => 'Furniture',
                'code' => 'CAT-FUR',
                'description' => 'Perabotan dan perlengkapan ruangan.',
                'status' => 'active',
            ],
            [
                'name' => 'IT Equipment',
                'code' => 'CAT-IT',
                'description' => 'Peralatan IT dan jaringan.',
                'status' => 'active',
            ],
            [
                'name' => 'Lainnya',
                'code' => 'CAT-LAIN',
                'description' => 'Kategori lainnya.',
                'status' => 'inactive',
            ],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['code' => $category['code']],
                $category,
            );
        }
    }
}