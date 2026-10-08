<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        $byRole = collect(UserRole::cases())->map(fn (UserRole $role) => [
            'value' => $role->value,
            'label' => $role->label(),
            'count' => User::whereJsonContains('roles', $role->value)->count(),
        ])->values();

        return response()->json([
            'byRole' => $byRole,
            'totalUsers' => User::count(),
        ]);
    }

}
