<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Purchase;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class PurchaseSeeder extends Seeder
{
    /**
     * Seed sample purchase history with demo proof files.
     */
    public function run(): void
    {
        $dir = public_path('uploads/purchases');
        File::ensureDirectoryExists($dir);

        $demoProof = $dir.'/demo-proof.png';
        if (! File::exists($demoProof)) {
            // 1x1 PNG placeholder used to demonstrate proof uploads.
            File::put(
                $demoProof,
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
            );
        }

        $laptop = Asset::query()->where('asset_code', 'AST-004')->first();
        $proyektor = Asset::query()->where('asset_code', 'AST-001')->first();

        $purchases = [
            [
                'purchase_number' => 'PCH-0001',
                'supplier' => 'PT Elektronik Sentral',
                'invoice_number' => 'INV-2024/001',
                'purchase_date' => '2024-01-15',
                'amount' => 4500000,
                'proof_path' => 'uploads/purchases/demo-proof.png',
                'notes' => 'Pembelian proyektor untuk ruang rapat.',
                'asset_id' => $proyektor?->id,
            ],
            [
                'purchase_number' => 'PCH-0002',
                'supplier' => 'PT Komputer Jaya',
                'invoice_number' => 'INV-2025/004',
                'purchase_date' => '2025-03-10',
                'amount' => 15900000,
                'proof_path' => 'uploads/purchases/demo-proof.png',
                'notes' => 'Pembelian laptop untuk tim pengembangan.',
                'asset_id' => $laptop?->id,
            ],
        ];

        foreach ($purchases as $purchase) {
            Purchase::query()->updateOrCreate(
                ['purchase_number' => $purchase['purchase_number']],
                $purchase,
            );
        }
    }
}