<?php

namespace App\Listeners;

use App\Events\UserCreated;
use App\Models\User;
use App\Models\UserNotification;



class NotifyUsersOfNewUser
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(UserCreated $event): void
    {
        $newUser = $event->user;
        $now = now();
        $title = 'Yeni Kullanıcı Eklendi';
        $message = $newUser->name . ' ekibe katıldı (' . $newUser->roles->map->label()->implode(', ') . ')';


        $rows = User::where('id', '!=', $newUser->id)
            ->pluck('id')
            ->map(fn ($id) => [
                'user_id' => $id,
                'title' => $title,
                'message' => $message,
                'created_at' => $now,
                'updated_at' => $now, 

            ])
            ->all();
        UserNotification::insert($rows);    
    }
}
