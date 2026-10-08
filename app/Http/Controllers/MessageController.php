<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Resources\UserMessageResource;
use Illuminate\Http\Request;
use App\Models\Message;
use GuzzleHttp\Psr7\Query;
use Illuminate\Support\Facades\Broadcast;

class MessageController extends Controller
{
    public function index() {
        return UserMessageResource::collection(
            Message::with('user')->oldest()->get()
        );
    }

    public function store (Request $request)
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:500']
        ]);

        $message = $request->user()->messages()->create($data);

        Broadcast(new Message($message))->toOthers();

        return (new UserMessageResource($message));
    }

    public function unread (Request $request)
    {
        $user = $request->user();

        $count = Message::where('user_id', '!=', $user->id)
        ->when($user->chat_last_read_at, fn($query) =>
        $query->where('created_at', '>', $user->chat_last_read_at)
        )
        ->count();

        return response()->json(['count' => $count]);
    }

    public function read(Request $request)
    {
        $user = $request->user();
        $user->chat_last_read_at =now();
        $user->save();

        return response()->noContent();

    }
}
