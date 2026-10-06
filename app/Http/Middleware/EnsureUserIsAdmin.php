<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isAdmin()) {
            return $next($request); // İzin ver, isteğe devam et
        }

        // Değilse 403 Forbidden cevabı fırlat
        return response()->json([
            'message' => 'Bu işlem için yetkiniz yok!'
        ], 403);
    }
}
