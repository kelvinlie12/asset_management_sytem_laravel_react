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
        Schema::create('asset_damages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->nullable()->constrained('assets')->nullOnDelete();
            $table->date('damage_date');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('description');
            $table->string('photo_path')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('performed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_damages');
    }
};
