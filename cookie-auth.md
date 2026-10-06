# Bearer Token'dan HttpOnly Cookie Oturumuna Geçiş (Sanctum SPA)

Bu dosya, projedeki kimlik doğrulamanın **Bearer token + `localStorage`** yönteminden **HttpOnly cookie oturumuna** (Laravel Sanctum SPA authentication) geçirilmesinin aşama aşama kaydıdır.

## Neden geçtik?

Eski yöntemde giriş yapınca sunucu bir token üretiyor, React bunu `localStorage`'a yazıp her isteğe `Authorization: Bearer ...` başlığı olarak ekliyordu.

Sorun şuydu: `localStorage`'ı sayfadaki **her JavaScript okuyabilir**. Test sırasında şu yapıldı:

1. Admin hesabıyla giriş yapıldı
2. F12 → Console'dan token kopyalandı (`localStorage.getItem('token')`)
3. Normal kullanıcı (basic user) hesabıyla giriş yapıldı
4. Token `localStorage`'a yapıştırıldı
5. Sunucu token'ın sahibini admin sandığı için kullanıcı silme gibi yetkili işlemler yapılabildi

Bu bir rol kontrolü hatası değildi. Bearer token, "bu kişiyim" değil **"bu anahtara sahibim"** anlamına gelir, sunucu anahtarı gösteren kişiyi sahibinden ayıramaz. Rol kontrolü ([EnsureUserIsAdmin.php](app/Http/Middleware/EnsureUserIsAdmin.php)) sunucu tarafında doğru çalışıyordu. Asıl risk, token'ın JavaScript'ten okunabilmesiydi: sayfaya sızan bir XSS açığı token'ı uzaktan çalabilirdi.

Ek olarak [config/sanctum.php](config/sanctum.php)'te `'expiration' => null` olduğu için token'ların süresi hiç dolmuyordu.

## Yeni mimari

```
Giriş:
  1. GET  /sanctum/csrf-cookie  → tarayıcı XSRF-TOKEN cookie'sini alır
  2. POST /api/login            → axios XSRF-TOKEN'ı X-XSRF-TOKEN başlığına koyar
                                  Laravel oturum açar, laravel-session cookie'si (HttpOnly) verir

Sonraki her istek:
  tarayıcı laravel-session cookie'sini kendisi ekler (JavaScript göremez)
```

### İki cookie, iki farklı iş

| Cookie | JavaScript okuyabilir mi? | Görevi |
|---|---|---|
| `laravel-session` | ❌ Hayır (`HttpOnly`) | Oturum kimliğini taşır. Çalınırsa hesap ele geçirilir |
| `XSRF-TOKEN` | ✅ Evet (bilerek) | CSRF koruması. Kimlik taşımaz, tek başına işe yaramaz |

`XSRF-TOKEN`'ın JavaScript'e açık olması bilinçli bir tasarım: axios onu okuyup `X-XSRF-TOKEN` başlığına kopyalamak zorunda. Sunucu isteği kabul etmek için **ikisini birden** ister (cookie + başlık).

## Aşama 1: Backend ayarları

**`.env`**

```
SANCTUM_STATEFUL_DOMAINS="localhost:5173"
```

Sanctum, isteğin geldiği adresi bu listeyle karşılaştırıp "bu bir SPA, oturum aç" ya da "bu düz API isteği, token bekle" kararını verir. Varsayılan listede (`config/sanctum.php`) `localhost:5173` yoktu, port **dahil** yazılması şart.

**`bootstrap/app.php`**: `withMiddleware` içine:

```php
$middleware->statefulApi();
```

Bu, `/api/*` isteklerine oturum ve cookie desteğini ekler. Doğrulama:

```
php artisan route:list --path=api/chat -vv
```

Çıktıda `EnsureFrontendRequestsAreStateful` görünmeli (`-v` grubu sadece `api` olarak gösterir, `-vv` açar).

**`config/cors.php`**

```php
'supports_credentials' => true,
```

Tarayıcı bu başlık yoksa cookie'li istekleri engeller. `allowed_origins` ise `*` olamaz, tam adres olmalı (`http://localhost:5173`).

Her `.env`/config değişikliğinden sonra `php artisan config:clear` ve `php artisan serve`'ü yeniden başlat.

## Aşama 2: AuthController

`app/Http/Controllers/AuthController.php`:

**Önce:** kullanıcıyı `User::where(...)` ile bul, `Hash::check` ile şifreyi karşılaştır, `createToken` ile token üret, JSON'a koy. Çıkışta `currentAccessToken()->delete()`.

**Şimdi:**

```php
public function login(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($validated)) {
        return response()->json(['message' => 'E posta veya Şifre Hatalı!'], 401);
    }

    $request->session()->regenerate();

    return response()->json([
        'message' => 'Giriş Başarılı',
        'user' => Auth::user(),
    ]);
}

public function logout(Request $request)
{
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Çıkış Yapıldı']);
}
```

- `Auth::attempt($validated)`: **bir dizi** (`email` + `password`) alır, kullanıcıyı bulur, şifreyi kontrol eder, doğruysa oturumu açar. `User::where` ve `Hash::check` gereksiz kaldı
- `session()->regenerate()`: giriş sonrası oturum kimliğini yeniler, **session fixation** saldırısını önler (saldırganın önceden bildiği oturum kimliğiyle kurbanı giriş yaptırması)
- `logout`: üç adım şart. `logout()` kullanıcıyı çıkarır, `invalidate()` oturum verisini siler, `regenerateToken()` CSRF token'ını yeniler. `return`'ün en sonda olması gerekir, üstünde olursa alttaki satırlar hiç çalışmaz
- `createToken` ve cevaptaki `token` kalktı. Eski `currentAccessToken()->delete()` cookie ile **çalışmazdı**: oturumlu istekte `currentAccessToken()` geçici bir nesne döndürür ve `delete()` metodu yoktur

## Aşama 3: `frontend/src/api.js`

**Önce:** bir interceptor `localStorage`'dan token okuyup `Authorization` başlığı ekliyordu.

**Şimdi:**

```js
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  withXSRFToken: true,
})
```

- `withCredentials: true`: tarayıcıya "farklı origin'e (5173 → 8000) giden isteklerde cookie gönder ve al" der. [cors.php](config/cors.php)'deki `supports_credentials`'ın frontend karşılığıdır, ikisi de açık olmalı
- `withXSRFToken: true`: aşağıdaki "Karşılaşılan sorunlar" bölümüne bak
- Interceptor silindi, gönderilecek token yok

## Aşama 4: `frontend/src/pages/Login.jsx`

```js
const handleLogin = async () => {
  setError('')

  try {
    await api.get('http://localhost:8000/sanctum/csrf-cookie')
    await api.post('/login', formData)
    navigate('/')
  } catch (err) {
    setError(err.response?.data?.message || 'Giriş başarısız oldu!')
  }
}
```

- Login artık ham `axios` değil `api` örneğini kullanıyor, böylece `withCredentials` ve `withXSRFToken` ayarları geçerli olur
- `localStorage.setItem('token', ...)` kalktı
- CSRF cookie isteği **`/api` altında değil** (`/sanctum/csrf-cookie`), bu yüzden tam adres yazıldı. Axios tam adres görünce `baseURL`'i yok sayar
- İkisi de `await` ile **sırayla** bekleniyor: CSRF cookie gelmeden login atılırsa 419 alınır
- `useEffect` burada kullanılamaz: hook'lar başka bir fonksiyonun içinde çağrılamaz ve zaten buton tıklaması için gerekmez

## Aşama 5: Giriş koruması (`ProtectedRoute`)

Oturum cookie'si HttpOnly olduğu için React "giriş yapmış mıyım" sorusuna kendi başına cevap veremez. Tek yol sunucuya sormaktır: `GET /profile` (giriş yapmışsa kullanıcıyı döndürür, yapmamışsa 401).

`frontend/src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api'

function ProtectedRoute() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    api.get('/profile')
      .then(() => setStatus('authed'))
      .catch(() => setStatus('guest'))
  }, [])

  if (status === 'loading') return null
  if (status === 'guest') return <Navigate to='/login' replace />
  return <Outlet />
}
```

Üç durumlu state bilinçli seçildi: `true/false` yetmez, çünkü "henüz bilmiyorum" durumu da lazım. Yoksa istek bitmeden kullanıcı login'e atılırdı.

`frontend/src/config/RouteConfig.jsx`: `Layout` bu bileşenle sarıldı:

```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<Layout />}>
    ...sayfalar...
  </Route>
</Route>
```

`/login` ve `/` dışarıda kaldı. Giriş yapmamış biri korumalı bir sayfaya gelince Layout'a ve sayfaya hiç ulaşılmaz, sayfaların 401 hata yağdıran istekleri de atılmaz.

Ek temizlik: `Layout.jsx`'teki logout'tan `localStorage.removeItem('token')` satırı silindi.

## Aşama 6: WebSocket yetkilendirmesi

Private kanala bağlanmadan önce Echo, `/broadcasting/auth` adresine yetki sorar. Bu isteği **axios değil pusher-js** atar, bu yüzden `api.js`'teki `withCredentials` ve `withXSRFToken` ayarları o isteğe uygulanmaz ve eski Bearer başlığı da artık geçersizdir.

**Backend:** `bootstrap/app.php`:

```php
->withBroadcasting(
    __DIR__.'/../routes/channels.php',
    ['middleware' => ['api', 'auth:sanctum']],
)
```

`statefulApi()`'nin eklediği oturum middleware'i yalnızca `api` grubunun içindedir. Broadcasting route'u bu grubun dışında kalırsa oturumu hiç göremez ve "giriş yapmamış" sanar (401). `api` önce gelir ki oturum başlasın, sonra `auth:sanctum` kontrol etsin.

**Frontend:** `echo.js`'te `authEndpoint` ve `auth.headers` silindi, yerine **`authorizer`** yazıldı. Yetkilendirme isteğini kendi `api` örneğimizle atıyoruz, böylece cookie ve CSRF başlığı otomatik gelir:

```js
authorizer: (channel) => ({
  authorize: (socketId, callback) => {
    api.post('http://localhost:8000/broadcasting/auth', {
      socket_id: socketId,
      channel_name: channel.name,
    })
      .then(response => callback(false, response.data))
      .catch(error => callback(true, error))
  },
}),
```

`socket_id` ve `channel_name`, Laravel'in `/broadcasting/auth`'tan beklediği iki alandır.

## Karşılaşılan sorunlar ve çözümleri

### 1. `CSRF token mismatch` (419)

Belirti: giriş denenince `message: "CSRF token mismatch."`.

Teşhis: sunucu tarafı sağlıktı. CSRF cookie adresine tarayıcının gönderdiği başlıklarla (`Origin: http://localhost:5173`) istek atıldı: `204` döndü, hem `XSRF-TOKEN` hem `laravel-session` cookie'leri geldi, `Access-Control-Allow-Credentials: true` vardı. Yani cookie geliyordu ama istekte `X-XSRF-TOKEN` başlığı yoktu.

Sebep: yeni axios sürümleri (burada `^1.20`) güvenlik gerekçesiyle `X-XSRF-TOKEN` başlığını **sadece aynı origin'e** giden isteklere ekler. Sayfa `localhost:5173`, API `localhost:8000`, port farklı olduğu için **farklı origin** sayılır. `withCredentials: true` bu davranışı değiştirmez.

Çözüm: `axios.create` ayarlarına `withXSRFToken: true`. Doğrulama: F12 → Network → `login` isteği → Request Headers'ta `X-XSRF-TOKEN` görünmeli.

### 2. "XSRF-TOKEN document.cookie'de görünüyor, bu normal mi?"

Evet. `XSRF-TOKEN` bilerek JavaScript'e açıktır (axios'un okuması gerek) ve tek başına kimlik taşımaz. `laravel-session` ise `HttpOnly`: F12 → Storage → Cookies'te **listelenir** (DevTools tarayıcının kendi aracıdır) ama konsolda `document.cookie` yazınca **görünmez**. Bu, sayfadaki hiçbir script'in oturum cookie'sine ulaşamadığını gösterir.

### 3. `localhost` ve `127.0.0.1` ayrı siteler

Sayfa `localhost:5173`'ten açılıp API'ye `127.0.0.1` ile gidilirse cookie gitmez. İki taraf da `localhost` olmalı. Reverb (WebSocket) bunun dışında: cookie istemediği için `127.0.0.1` kalabilir (ayrıca `localhost` IPv6 `::1`'e çözüldüğünde Reverb'e ulaşılamıyordu, bkz. [websocket.md](websocket.md)).

### 4. Cookie'ler port'a göre ayrılmaz

Sadece alan adına (`localhost`) göre ayrılır. Test sırasında `document.cookie` çıktısında projeyle ilgisiz `splunkweb_csrf_token_8000` göründü: aynı `localhost` üzerindeki başka bir uygulamanın (Splunk Web) cookie'si. Geliştirme ortamında zararsız, canlıda her uygulama kendi alan adında olur.

## Çalıştırma ve test

Üç ayrı terminal (değişiklik yok):

```
php artisan serve
php artisan reverb:start
cd frontend && npm run dev
```

Her zaman `http://localhost:5173` adresinden aç (127.0.0.1 değil).

**Giriş testi:**

1. F12 → Network: sırayla `csrf-cookie` (204) ve `login` (200) görünmeli
2. F12 → Storage → Cookies: `laravel-session` (HttpOnly işaretli) ve `XSRF-TOKEN`
3. Konsol: `localStorage.getItem('token')` → `null`
4. Konsol: `document.cookie` → `XSRF-TOKEN` var, `laravel-session` **yok**

**Koruma testi:**

1. Çıkış yapmış (veya gizli pencere) iken `localhost:5173/users` aç → `/login`'e atmalı
2. Giriş yap → `/home`
3. F5 → giriş yapmış kalmalı
4. Çıkış yap → `/login`. Geri tuşu → korumalı sayfaya dönememeli (`logout` oturumu sunucuda öldürür, `/profile` 401 verir)

**WebSocket testi:** İki farklı tarayıcı/pencerede iki farklı kullanıcıyla giriş yapıp birinden mesaj yaz. `/broadcasting/auth` isteği 200 dönmeli, mesaj diğerinde F5'siz görünmeli.

## Hata ayıklama rehberi

| Belirti | Bakılacak yer |
|---|---|
| Girişte 419 `CSRF token mismatch` | `withXSRFToken: true` var mı, login `api` örneğini mi kullanıyor, önce `csrf-cookie` çağrılıyor mu |
| Girişte 401 ama şifre doğru | İstek `SANCTUM_STATEFUL_DOMAINS`'teki adresten mi geliyor (`localhost:5173`), `statefulApi()` var mı |
| Cookie hiç gelmiyor | `supports_credentials`, `withCredentials`, adres `localhost` mu, `config:clear` yapıldı mı |
| Her istek 401, giriş yapılmış görünüyor | Oturum cookie'si gitmiyor: `withCredentials` ve CORS `allowed_origins` tam adres mi |
| `/broadcasting/auth` 401 | `withBroadcasting` middleware'inde `api` var mı (oturum başlamıyor olabilir) |
| `/broadcasting/auth` 419 | `authorizer` içinde `api` örneği kullanılıyor mu (ham axios/pusher değil) |
| `Navigate is not defined` | `ProtectedRoute.jsx`'te `Navigate` import edilmemiş |
| Sonsuz `/profile` isteği | `useEffect` bağımlılık dizisi `[]` eksik |

## Güvenlik değerlendirmesi: ne kazandık, ne kazanmadık?

| Saldırı | Bearer + `localStorage` | HttpOnly cookie |
|---|---|---|
| Sayfaya sızan kötü script (XSS) token'ı okuyup saldırgana gönderir | ✅ Mümkün | ❌ Script `laravel-session`'ı okuyamaz |
| Birinin tarayıcısında F12 açıp değeri kopyalamak | ✅ Mümkün | ✅ Mümkün (Storage sekmesinden) |
| Sahte site üzerinden kullanıcı adına istek (CSRF) | Yok (token otomatik gitmez) | `XSRF-TOKEN` + `SameSite=Lax` ile engelli |

Önlem **uzaktan, otomatik** çalmayı (XSS) engelliyor. Birinin kendi tarayıcısında kendi oturum verisine erişmesini hiçbir web teknolojisi engelleyemez. Testte yapılan "F12'den kopyala" saldırısı artık tek satırlık konsol komutuyla yapılamaz, ama DevTools'un Storage sekmesinden elle yine kopyalanabilir.

Zararı sınırlayanlar: `SESSION_LIFETIME=120` (oturum 2 saatlik hareketsizlikte düşer, eski token'ın süresi hiç yoktu) ve `logout`'un oturumu sunucuda geçersiz kılması.

Ayrıca: `session()->regenerate()` (session fixation), `HttpOnly` (XSS ile okuma), CSRF token ve `SameSite=Lax` (sahte site istekleri). Mülakatlarda sorulan klasik konular.

## Bilinen eksikler ve yapılacaklar

- **Canlıya alırken:** HTTPS (`SESSION_SECURE_COOKIE=true`), gerçek alan adı için `SANCTUM_STATEFUL_DOMAINS` ve `SESSION_DOMAIN`, `allowed_origins`'in canlı adresi, `SameSite` politikasının gözden geçirilmesi
