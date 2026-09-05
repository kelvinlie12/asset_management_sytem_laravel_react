<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            // Room becomes optional (an asset may be assigned to a user instead).
            $table->foreignId('room_id')->nullable()->change();

            // Rename the legacy code column to the asset_code identifier.
            $table->renameColumn('code', 'asset_code');
            $table->unique('asset_code');

            $table->string('photo')->nullable()->after('name');
            $table->decimal('purchase_price', 15, 2)->nullable()->after('photo');
            $table->date('purchase_date')->nullable()->after('purchase_price');
            $table->string('purchase_receipt')->nullable()->after('purchase_date');
            $table->string('condition')->default('GOOD')->after('description');
            $table->string('usage_status')->default('IN_STORAGE')->after('condition');
            $table->foreignId('team_id')->nullable()->after('room_id')->constrained('teams')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->after('team_id')->constrained('users')->nullOnDelete();

            $table->dropColumn('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->string('status')->default('active')->after('description');
            $table->dropForeign(['team_id']);
            $table->dropForeign(['assigned_user_id']);
            $table->dropColumn(['photo', 'purchase_price', 'purchase_date', 'purchase_receipt', 'condition', 'usage_status', 'team_id', 'assigned_user_id']);
            $table->dropUnique('assets_asset_code_unique');
            $table->renameColumn('asset_code', 'code');
            $table->foreignId('room_id')->nullable(false)->change();
        });
    }
};