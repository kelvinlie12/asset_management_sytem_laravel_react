<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add indexes on the columns most frequently used for filtering and sorting.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'users_role_index');
            $table->index('status', 'users_status_index');
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->index('condition', 'assets_condition_index');
            $table->index('usage_status', 'assets_usage_status_index');
        });

        Schema::table('vehicle_assets', function (Blueprint $table) {
            $table->index('condition', 'vehicle_assets_condition_index');
            $table->index('usage_status', 'vehicle_assets_usage_status_index');
            $table->index('tax_due_date', 'vehicle_assets_tax_due_date_index');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->index('purchase_date', 'purchases_purchase_date_index');
        });

        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->index('assigned_date', 'asset_assignments_assigned_date_index');
        });

        Schema::table('asset_transfers', function (Blueprint $table) {
            $table->index('transfer_date', 'asset_transfers_transfer_date_index');
        });

        Schema::table('asset_damages', function (Blueprint $table) {
            $table->index('damage_date', 'asset_damages_damage_date_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_index');
            $table->dropIndex('users_status_index');
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->dropIndex('assets_condition_index');
            $table->dropIndex('assets_usage_status_index');
        });

        Schema::table('vehicle_assets', function (Blueprint $table) {
            $table->dropIndex('vehicle_assets_condition_index');
            $table->dropIndex('vehicle_assets_usage_status_index');
            $table->dropIndex('vehicle_assets_tax_due_date_index');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('purchases_purchase_date_index');
        });

        Schema::table('asset_assignments', function (Blueprint $table) {
            $table->dropIndex('asset_assignments_assigned_date_index');
        });

        Schema::table('asset_transfers', function (Blueprint $table) {
            $table->dropIndex('asset_transfers_transfer_date_index');
        });

        Schema::table('asset_damages', function (Blueprint $table) {
            $table->dropIndex('asset_damages_damage_date_index');
        });
    }
};