<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
 
    public function up(): void
    {
        DB::table('users')
            ->whereRaw("roles->>0 = ?", ['admin'])
            ->update(['department' => 'system_manager']);
    }

  
    public function down(): void
    {
        DB::table('users')
            ->where('department', 'system_manager')
            ->update(['department' => null]);
    }
};
