<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleResource;
use App\Support\ApiResponse;
use App\Support\VehicleTaxReminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleTaxReminderController extends Controller
{
    /**
     * Return the vehicle tax reminder summary and the list of vehicles needing attention.
     */
    public function index(Request $request): JsonResponse
    {
        $result = VehicleTaxReminder::summarize();

        return ApiResponse::success([
            'summary' => $result['summary'],
            'vehicles' => VehicleResource::collection($result['vehicles']),
        ], 'Data pengingat pajak berhasil dimuat.');
    }
}
