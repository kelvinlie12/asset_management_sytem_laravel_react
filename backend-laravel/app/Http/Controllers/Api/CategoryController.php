<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a paginated, searchable list of categories.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = min(max($perPage, 1), 100);

        $categories = Category::query()
            ->withCount('assets')
            ->when($request->query('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->query('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(CategoryResource::collection($categories)->response()->getData(true), 'Data kategori berhasil dimuat.');
    }

    /**
     * Store a newly created category.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $category = Category::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? Category::STATUS_ACTIVE,
        ]);

        return ApiResponse::created([
            'category' => new CategoryResource($category->loadCount('assets')),
        ], 'Category created successfully.');
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category): JsonResponse
    {
        return ApiResponse::success([
            'category' => new CategoryResource($category->loadCount('assets')),
        ]);
    }

    /**
     * Update the specified category.
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return ApiResponse::success([
            'category' => new CategoryResource($category->fresh()->loadCount('assets')),
        ], 'Category updated successfully.');
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Request $request, Category $category): JsonResponse
    {
        if ($category->assets()->exists()) {
            return ApiResponse::error('Cannot delete a category that still has assets.', ['category' => ['Kategori masih memiliki aset.']], 422);
        }

        $category->delete();

        return ApiResponse::noContent('Category deleted successfully.');
    }
}