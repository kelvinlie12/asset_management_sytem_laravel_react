<?php

namespace App\Support;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Standardize the shape of every JSON API response.
 *
 * Success: { "success": true,  "message": "...", "data": ... }
 * Error:   { "success": false, "message": "...", "errors": ... }
 */
class ApiResponse
{
    /**
     * Return a standardized success envelope.
     *
     * @param mixed $data
     */
    public static function success($data = null, string $message = 'Data berhasil', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Return a standardized success envelope with a 201 Created status.
     *
     * @param mixed $data
     */
    public static function created($data = null, string $message = 'Data berhasil dibuat'): JsonResponse
    {
        return static::success($data, $message, 201);
    }

    /**
     * Return a standardized success envelope without a payload.
     */
    public static function noContent(string $message = 'Data berhasil'): JsonResponse
    {
        return static::success(null, $message, 200);
    }

    /**
     * Return a standardized error envelope.
     *
     * @param mixed $errors
     */
    public static function error(string $message = 'Terjadi kesalahan', $errors = null, int $status = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }

    /**
     * Map a thrown exception to a standardized error envelope.
     */
    public static function handle(Throwable $e): JsonResponse
    {
        if ($e instanceof ValidationException) {
            return static::error($e->getMessage(), $e->errors(), 422);
        }

        if ($e instanceof AuthenticationException) {
            return static::error('Unauthenticated.', null, 401);
        }

        if ($e instanceof AuthorizationException) {
            return static::error('Anda tidak memiliki izin untuk melakukan tindakan ini.', null, 403);
        }

        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel() ?? 'Resource');
            return static::error("Data {$model} tidak ditemukan.", null, 404);
        }

        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            $message = $e->getMessage() ?: (class_exists(\Symfony\Component\HttpFoundation\Response::class)
                ? \Symfony\Component\HttpFoundation\Response::$statusTexts[$status] ?? 'Error'
                : 'Error');
            return static::error($message, null, $status);
        }

        if (app()->hasDebugModeEnabled()) {
            $message = $e->getMessage() ?: 'Terjadi kesalahan';
        } else {
            $message = 'Terjadi kesalahan pada server.';
        }

        return static::error($message, null, 500);
    }
}
