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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_number')->unique();
            $table->string('supplier');
            $table->string('invoice_number');
            $table->date('purchase_date');
            $table->decimal('amount', 15, 2);
            $table->string('proof_path')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('asset_id')->nullable()->constrained('assets')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};