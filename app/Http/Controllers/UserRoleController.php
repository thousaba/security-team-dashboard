<?php

namespace App\Http\Controllers;

use App\Enums\Department;
use App\Enums\UserRole;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class UserRoleController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::orderBy('id')->get());
    }

    public function options(): JsonResponse
    {
        $toOption = fn ($case) => ['value' => $case->value, 'label' => $case->label()];

        return response()->json([
            'roles' => array_map($toOption, UserRole::cases()),
            'departments' => array_map($toOption, Department::cases()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:64'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['distinct', Rule::enum(UserRole::class)],
        ]);

        $roles = array_map(fn (string $role) => UserRole::from($role), $data['roles']);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'department' => collect($roles)->map->department()->filter()->first(),
            'roles' => $roles,
        ]);

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function destroy(User $user): Response
    {
        $user->delete();

        return response()->noContent();
    }

    public function update(Request $request, User $user): UserResource
    {
        $data = $request->validate([
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['distinct', Rule::enum(UserRole::class)],
        ]);

        $roles = array_map(fn (string $role) => UserRole::from($role), $data['roles']);

        $user->roles = $roles;
        $user->department = collect($roles)->map->department()->filter()->first();
        $user->save();

        return new UserResource($user);
    }
}
