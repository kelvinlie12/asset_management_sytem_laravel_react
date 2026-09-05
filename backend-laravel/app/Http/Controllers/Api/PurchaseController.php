<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Asset;
use App\Models\Purchase;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class PurchaseController extends Controller
{
    /**
     * Display a paginated, searchable list of purchases.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $purchases = Purchase::query()
            ->with(['asset.room', 'asset.category'])
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('purchase_number', 'like', "%{$search}%")
                        ->orWhere('supplier', 'like', "%{$search}%")
                        ->orWhere('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('asset', function ($asset) use ($search) {
                            $asset->where('asset_code', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('purchase_date')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(PurchaseResource::collection($purchases)->response()->getData(true), 'Data pembelian berhasil dimuat.');
    }

    /**
     * Store a purchase, create its asset, and record the purchase history.
     */
    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $proofPath = null;
        if ($request->hasFile('proof')) {
            $file = $request->file('proof');
            $ext = strtolower($file->guessExtension() ?: 'bin');
            $name = 'proof_'.md5(uniqid((string) random_int(0, PHP_INT_MAX), true)).'.'.$ext;
            $file->move(public_path('uploads/purchases'), $name);
            $proofPath = 'uploads/purchases/'.$name;
        }

        $purchase = DB::transaction(function () use ($validated, $proofPath) {
            $asset = Asset::create([
                'asset_code' => $this->nextAssetCode(),
                'name' => $validated['name'],
                'category_id' => $validated['category_id'] ?? null,
                'room_id' => $validated['room_id'] ?? null,
                'purchase_price' => $validated['amount'],
                'purchase_date' => $validated['purchase_date'],
                'purchase_receipt' => $validated['invoice_number'],
                'description' => $validated['notes'] ?? null,
                'condition' => Asset::CONDITION_GOOD,
                'usage_status' => Asset::USAGE_IN_STORAGE,
            ]);

            return Purchase::create([
                'purchase_number' => $this->nextPurchaseNumber(),
                'supplier' => $validated['supplier'],
                'invoice_number' => $validated['invoice_number'],
                'purchase_date' => $validated['purchase_date'],
                'amount' => $validated['amount'],
                'proof_path' => $proofPath,
                'notes' => $validated['notes'] ?? null,
                'asset_id' => $asset->id,
            ]);
        });

        return ApiResponse::created([
            'purchase' => new PurchaseResource($purchase->load(['asset.room', 'asset.category'])),
        ], 'Purchase recorded and asset created successfully.');
    }

    /**
     * Display the specified purchase.
     */
    public function show(Purchase $purchase): JsonResponse
    {
        return ApiResponse::success([
            'purchase' => new PurchaseResource($purchase->load(['asset.room', 'asset.category'])),
        ]);
    }

    /**
     * Remove the specified purchase history record.
     */
    public function destroy(Request $request, Purchase $purchase): JsonResponse
    {
        if ($purchase->proof_path) {
            $path = public_path($purchase->proof_path);
            if (File::exists($path)) {
                File::delete($path);
            }
        }

        $purchase->delete();

        return ApiResponse::noContent('Purchase record deleted successfully.');
    }

    /**
     * Generate the next sequential asset code (e.g. AST-007).
     */
    private function nextAssetCode(): string
    {
        $max = 0;
        foreach (Asset::query()->pluck('asset_code') as $code) {
            if (is_string($code) && preg_match('/^AST-(\d+)$/', $code, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }

        do {
            $code = 'AST-'.str_pad(++$max, 3, '0', STR_PAD_LEFT);
        } while (Asset::query()->where('asset_code', $code)->exists());

        return $code;
    }

    /**
     * Generate the next sequential purchase number (e.g. PCH-0001).
     */
    private function nextPurchaseNumber(): string
    {
        $max = 0;
        foreach (Purchase::query()->pluck('purchase_number') as $number) {
            if (is_string($number) && preg_match('/^PCH-(\d+)$/', $number, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }

        do {
            $number = 'PCH-'.str_pad(++$max, 4, '0', STR_PAD_LEFT);
        } while (Purchase::query()->where('purchase_number', $number)->exists());

        return $number;
    }
}