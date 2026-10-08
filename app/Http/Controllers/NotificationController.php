<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\Request;
use App\Http\Resources\UserNotificationResource;


class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return UserNotificationResource::collection(
            $request->user()->userNotifications()->latest()->get()
        );
    }

    public function markAsRead(Request $request, int $id)
    {
        $notification = $request->user()->userNotifications()->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return new UserNotificationResource($notification);

    }

    public function unreadCount (Request $request)
    {
        $count = $request->user()->userNotifications()->whereNull('read_at')->count();

        return response()->json(['count' => $count]);
    }

}
