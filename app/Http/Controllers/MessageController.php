<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Http\Resources\UserMessageResource;
use Illuminate\Http\Request;
use App\Models\Message;

class MessageController extends Controller
{
    public function index()
    {
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

        broadcast(new MessageSent($message))->toOthers();

        return new UserMessageResource($message);

    }
}
