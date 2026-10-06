<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request){
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($validated)){
            return response()->json([
                'message' => 'E posta veya Şifre Hatalı!'
            ], 401);
        }

        $request->session()->regenerate();
        
        return response()->json([
            'message' => 'Giriş Başarılı',
            'user' => Auth::user(),
        ]);
    }


    public function logout(Request $request){
        Auth::guard('web')->logout();
        
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return response()->json(['message'=> 'Çıkış Yapıldı']);

    }
}
