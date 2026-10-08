<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleMap = [
            'standard_user' => 'grc_analyst',
            'software_developer' => 'incident_responder',
        ];

        foreach ($roleMap as $old => $new) {
            DB::table('users')
                ->whereRaw('roles @> ?::jsonb', [json_encode([$old])])
                ->update(['roles' => json_encode([$new])]);
        }

        $departmentByRole = [
            'soc_manager' => 'soc',
            'soc_analyst' => 'soc',
            'incident_responder' => 'soc',
            'threat_hunter' => 'threat_intelligence',
            'detection_engineer' => 'detection_engineering',
            'malware_analyst' => 'malware_analysis',
            'grc_analyst' => 'grc',
        ];

        foreach ($departmentByRole as $role => $department) {
            DB::table('users')
                ->whereRaw('roles @> ?::jsonb', [json_encode([$role])])
                ->update(['department' => $department]);
        }

        DB::statement("ALTER TABLE users ALTER COLUMN roles SET DEFAULT '[]'::jsonb");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users ALTER COLUMN roles SET DEFAULT '[\"standard_user\"]'::jsonb");
    }
};
