<?php

namespace App\Http\Resources;

use App\Enums\Department;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'roles' => $this->roles->map(fn (UserRole $role) => [
                'value' => $role->value,
                'label' => $role->label(),
            ])->values(),
            'department' => $this->department ? [
                'value' => $this->department->value,
                'label' => $this->department->label(),
            ] : null,
        ];
    }
}
