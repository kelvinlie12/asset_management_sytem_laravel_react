<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

        // Super admins are granted every ability regardless of assigned permissions.
        // Return null for everyone else so the gate can continue to Spatie's
        // permission check (returning false here would deny all other users).
        Gate::before(function ($user, $ability) {
            if ($user instanceof User && $user->isSuperAdmin()) {
                return true;
            }
        });
    }
}
