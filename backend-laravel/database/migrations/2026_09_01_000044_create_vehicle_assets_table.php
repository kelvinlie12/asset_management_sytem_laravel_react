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
        Schema::create('vehicle_assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_code')->unique();
            $table->string('photo')->nullable();
            $table->string('brand');
            $table->string('model');
            $table->string('plate_number')->nullable();
            $table->string('engine_number')->nullable();
            $table->string('chassis_number')->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 15, 2)->nullable();
            $table->date('tax_due_date')->nullable();
            $table->text('description')->nullable();
            $table->string('condition')->default('GOOD');
            $table->string('usage_status')->default('IN_STORAGE');
            $table->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_assets');
    }
};
