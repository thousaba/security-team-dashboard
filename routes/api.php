<?php

declare(strict_types=1);

use App\Http\Controllers\UserRoleController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MessageController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
  Route::get('/users', [UserRoleController::class, 'index']);
  Route::get('/options', [UserRoleController::class, 'options']);
  Route::post('/logout', [AuthController::class, 'logout']);
  Route::get('/profile', [ProfileController::class, 'show']);
  Route::put('/profile', [ProfileController::class, 'update']);
  Route::get('/stats', [StatsController::class, 'index']);
  Route::get('/notifications', [NotificationController::class, 'index']);
  Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
  Route::get('/chat', [MessageController::class, 'index']);  
  Route::post('/chat', [MessageController::class, 'store']);
  Route::get('/chat/unread', [MessageController::class, 'unread']);
  Route::post('/chat/read', [MessageController::class, 'read']);
  Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);




  Route::middleware('admin')->group(function(){
    Route::post('/users', [UserRoleController::class, 'store']);
    Route::put('/users/{user}', [UserRoleController::class, 'update']);
    Route::delete('/users/{user}', [UserRoleController::class, 'destroy']);
  });    
});
