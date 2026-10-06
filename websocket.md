# Gerçek Zamanlı Chat: Laravel Reverb ile WebSocket Kurulumu

Bu dosya, security-team-dashboard projesine eklenen **grup sohbeti** özelliğinin ve onu gerçek zamanlı yapan WebSocket altyapısının aşama aşama kaydıdır.

## Özet

Tüm kullanıcıların girip yazabildiği tek bir ortak sohbet odası var. Bir kullanıcı mesaj gönderince, diğer kullanıcılar sayfayı yenilemeden mesajı anında görür.

```
Form → axios POST /api/chat → validation → DB (messages)
                                   │
                                   └→ MessageSent event → Reverb (8080)
                                                              │
                              Echo (React, private kanal 'chat') ←┘
                                   │
                              setMessages → ekranda görünür
```

## Mimari: hangi parça ne yapar?

| Parça | Adres | Görevi |
|---|---|---|
| Laravel API (`php artisan serve`) | `localhost:8000` | Normal HTTP istekleri: login, mesaj listele, mesaj gönder |
| Reverb (`php artisan reverb:start`) | `127.0.0.1:8080` | WebSocket sunucusu, açık bağlantılar üzerinden anlık mesaj iter |
| React (`npm run dev`) | `localhost:5173` | Arayüz, Echo ile Reverb'e bağlanır |

HTTP istek-cevap şeklinde çalışır ve cevaptan sonra bağlantı kapanır. WebSocket ise açık kalan bir bağlantıdır, sunucu istediği an istemciye veri gönderebilir. `artisan serve` bunu yapamadığı için Reverb ayrı bir süreç olarak çalışır.

## Aşama 1: Veri modeli

`php artisan make:model Message -m` ile model ve migration üretildi.

**Migration** (`database/migrations/..._create_messages_table.php`):

```php
$table->id();
$table->foreignId('user_id')->constrained();
$table->string('content', 500);
$table->timestamps();
```

- `constrained()`: `user_id` gerçek bir kullanıcıya bağlı olmak zorunda (foreign key)
- `cascadeOnDelete()` bilerek **kullanılmadı**: mesajı olan kullanıcı silinemez, mesaj kayıtları korunur
- Mesaj silme özelliği yok (route veya buton yazılmadı)
- Kullanıcı adı `messages` tablosuna kopyalanmadı, `user_id` üzerinden `users` tablosundan okunur (veri tekrarı yok)

**İlişkiler:**

- `Message::user()` → `belongsTo(User::class)`
- `User::messages()` → `hasMany(Message::class)`

**Mass assignment:** `Message` modelinde `#[Fillable(['user_id', 'content'])]`. `user_id` kullanıcıdan değil, giriş yapmış kullanıcıdan alınır (aşama 3).

## Aşama 2: API Resource

`app/Http/Resources/UserMessageResource.php`: frontend'e hangi alanların gideceğini belirler.

```php
return [
    'id' => $this->id,
    'user' => $this->user->name,
    'content' => $this->content,
    'created_at' => $this->created_at,
];
```

Hem `GET /api/chat` hem de WebSocket event'i aynı Resource'u kullanır, bu yüzden iki yolda da JSON şekli aynıdır.

## Aşama 3: Controller ve route'lar

`routes/api.php`, `auth:sanctum` grubunun içinde (admin grubunun dışında, herkes kullanabilir):

```php
Route::get('/chat', [MessageController::class, 'index']);
Route::post('/chat', [MessageController::class, 'store']);
```

`app/Http/Controllers/MessageController.php`:

- **`index`**: `Message::with('user')->oldest()->get()`. Tüm mesajlar (kullanıcıya özel değil, grup sohbeti). `with('user')` N+1 sorgu problemini önler.
- **`store`**: `content` doğrulanır (`required`, `string`, `max:500`), mesaj `$request->user()->messages()->create($data)` ile kaydedilir. Bu sayede `user_id` istekten değil, giriş yapmış kullanıcının oturumundan gelir; başka biri adına mesaj yazılamaz.

## Aşama 4: Frontend, statik arayüzden API'ye

`frontend/src/pages/Chat.jsx`:

- `messages` ve `text` state'leri
- `useEffect` ile sayfa açılınca `GET /chat`
- `map` ile mesaj listesi (`key={message.id}`)
- Controlled input ile form, `handleSubmit` içinde `POST /chat` ve dönen mesajın listeye eklenmesi
- Stil: `App.css` içinde `.message-list`


## Aşama 5: WebSocket altyapısı (Reverb)

### 5.1 Reverb kurulumu

```
php artisan install:broadcasting
```

Bu komut şunları yaptı:

- `laravel/reverb` paketi, `config/reverb.php`, `config/broadcasting.php`, `routes/channels.php` oluşturuldu
- `.env`'e `REVERB_*` ayarları eklendi, `BROADCAST_CONNECTION=reverb` yapıldı
- Kök `package.json`'a `laravel-echo` ve `pusher-js` eklendi (**React ayrı proje olduğu için bunlar orada kullanılmaz**, bkz. 5.5)

`.env` içinde `BROADCAST_CONNECTION` iki kez tanımlıydı, tekrarı temizlendi.

### 5.2 Event

`app/Events/MessageSent.php`:

```php
class MessageSent implements ShouldBroadcastNow
{
    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('chat')];
    }

    public function broadcastWith(): array
    {
        return (new UserMessageResource($this->message->load('user')))->resolve();
    }
}
```

- `ShouldBroadcastNow`: kuyruğa atmadan anında yayınlar. `QUEUE_CONNECTION=database` olduğu için `ShouldBroadcast` kullanılsaydı `php artisan queue:work` da çalışmak zorunda olurdu
- `PrivateChannel('chat')`: sadece yetkili (giriş yapmış) kullanıcılar dinleyebilir
- `broadcastWith`: Resource'u `resolve()` ile düz diziye çevirir

### 5.3 Event'in tetiklenmesi

`MessageController::store` içinde, mesaj kaydedildikten sonra:

```php
broadcast(new MessageSent($message))->toOthers();
```

`toOthers()` event'i **gönderen kişi hariç** herkese yollar. Gönderen mesajı zaten `handleSubmit` ile listesine ekliyor, yoksa mesaj iki kere görünürdü.

### 5.4 Kanal yetkilendirmesi

`routes/channels.php`:

```php
Broadcast::channel('chat', function ($user) {
    return true;
});
```

Giriş yapmış herkes `chat` kanalına girebilir.

`bootstrap/app.php`: kanal route'ları Sanctum ile korunacak şekilde kaydedildi. `withRouting` içindeki `channels:` satırı kaldırılıp yerine `withBroadcasting` eklendi:

```php
->withBroadcasting(
    __DIR__.'/../routes/channels.php',
    ['middleware' => ['api', 'auth:sanctum']],
)
```

Bu, `/broadcasting/auth` route'unu `api` ve `auth:sanctum` middleware'leriyle açar. `api` grubu, `statefulApi()`'nin eklediği oturum (cookie) middleware'ini taşır. Grup olmazsa route oturumu hiç göremez ve "giriş yapmamış" sanar (401). Kontrol:

```
php artisan route:list --path=broadcasting -v
```

Çıktıda `broadcasting/auth` ve `Authenticate:sanctum` görünmeli.

> Not: Bu sohbet ilk yazıldığında giriş Bearer token ile yapılıyordu ve burada yalnızca `['auth:sanctum']` vardı. Kimlik doğrulama sonradan HttpOnly cookie oturumuna geçirildi, bu yüzden `api` grubu eklendi. Ayrıntı: [cookie-auth.md](cookie-auth.md).

### 5.5 Frontend: Echo

React uygulaması `frontend/` klasöründe ayrı bir proje olduğu için paketler orada ayrıca kuruldu:

```
cd frontend
npm install laravel-echo pusher-js
```

**`frontend/.env`**: Vite sadece `VITE_` önekli değişkenleri tarayıcıya açar ve **kökteki `.env`'i okumaz**. `${...}` referansları da çözülmez, bu yüzden gerçek değerler yazıldı:

```
VITE_REVERB_APP_KEY=<kökteki REVERB_APP_KEY>
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

**`frontend/src/echo.js`**: Echo'yu üreten bir fonksiyon:

```js
import api from './api'

export default function createEcho() {
  return new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
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
  })
}
```

- Yetkilendirme isteğini Echo/pusher-js kendisi atarsa, `api.js`'teki `withCredentials` ve `withXSRFToken` ayarları o isteğe uygulanmaz ve cookie/CSRF gitmez. Bu yüzden `authorizer` ile isteği kendi `api` örneğimizle atıyoruz. `socket_id` ve `channel_name`, Laravel'in `/broadcasting/auth`'tan beklediği iki alandır
- Adres tam yazıldı: route `/broadcasting/auth`, `/api/broadcasting/auth` **değil** (`api.js`'in `baseURL`'indeki `/api` öneki burada geçerli değil)
- Echo bir fonksiyon (`createEcho`) olarak dışa aktarılıyor, `Chat.jsx` açılınca çağrılıyor. Dosya seviyesinde `new Echo(...)` uygulama açılırken, kullanıcı daha giriş yapmamışken bağlanmaya çalışırdı

> Not: İlk sürümde burada `authEndpoint` ve `auth: { headers: { Authorization: 'Bearer ...' } }` vardı (giriş o zaman Bearer token ile yapılıyordu). Cookie oturumuna geçince kaldırıldı, bkz. [cookie-auth.md](cookie-auth.md).

### 5.6 Chat.jsx'te dinleme

```js
const echoRef = useRef(null)

useEffect(() => {
  const echo = createEcho()
  echoRef.current = echo

  echo.private('chat').listen('MessageSent', (e) => {
    setMessages(prev => prev.some(m => m.id === e.id) ? prev : [...prev, e])
  })

  return () => echo.disconnect()
}, [])
```

- `listen('MessageSent')`: Echo olay adının başına `App.Events.` önekini kendisi ekler
- `some(m => m.id === e.id)`: aynı mesaj zaten listedeyse tekrar eklemez
- `return () => echo.disconnect()`: sayfadan çıkınca bağlantıyı kapatır (cleanup)

`handleSubmit` içinde isteğe `X-Socket-ID` başlığı eklendi, böylece backend `toOthers()` ile gönderen bağlantıyı tanıyıp ona event göndermez:

```js
api.post('/chat', { content: text }, {
  headers: { 'X-Socket-ID': echoRef.current?.socketId() },
})
```

`echoRef` (`useRef`) kullanıldı çünkü Echo nesnesine effect'in dışındaki `handleSubmit`'in de erişmesi gerekiyor ve ref değişince sayfa yeniden çizilmez.

## Karşılaşılan sorunlar ve çözümleri

### 1. CORS hatası: `/broadcasting/auth`

Belirti: konsolda "CORS üst bilgisi 'Access-Control-Allow-Origin' eksik", durum kodu 200.
Sebep: `config/cors.php` içindeki `paths` yalnızca `api/*` ve `sanctum/csrf-cookie` yollarını kapsıyordu, `/broadcasting/auth` bu listede yoktu.
Çözüm:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],
```

### 2. WebSocket bağlantı hatası: `localhost` ve IPv6

Belirti: `ws://localhost:8080/... sunucusuyla bağlantı kuramıyor`.
Sebep: `localhost`, makinede önce `::1` (IPv6) olarak çözülüyor. Reverb sadece IPv4'te (`0.0.0.0`) dinlediği için `::1:8080` adresinde kimse yok. `127.0.0.1:8080` ise bağlanıyordu.
Çözüm: `frontend/.env` içinde `VITE_REVERB_HOST=127.0.0.1`. `.env` değişince `npm run dev` yeniden başlatıldı (Vite `.env`'i sadece açılışta okur).

### 3. Konsoldaki iki hata mesajı (zararsız)

Belirti: Chat çalışırken konsolda "bağlantı kuramıyor" ve "bağlantı kesildi" mesajları kalıyor.
Sebep: `main.jsx`'te `<StrictMode>` var. React geliştirme modunda effect'i bilerek iki kere çalıştırır: ilk Echo bağlantısı kurulmadan cleanup ile kapatılır (hata mesajlarının kaynağı), ikincisi bağlanır ve çalışır.
Çözüm: gerekmez. Sadece `npm run dev` modunda görünür, üretim derlemesinde çıkmaz. Cleanup fonksiyonu doğru yazıldığı için asıl bağlantı sağlam.

## Çalıştırma

Üç ayrı terminal:

```
php artisan serve                 # Laravel API, 8000
php artisan reverb:start          # WebSocket sunucusu, 8080
cd frontend && npm run dev        # React, 5173
```

`.env` değişikliklerinden sonra ilgili süreçler yeniden başlatılmalı. Reverb'in dinlediği süreç `php` olmalı, `8080` portunda başka servisler de dinliyor olabilir (ör. `svchost`), onlara dokunulmamalı.

**Test:** İki farklı kullanıcıyla (normal pencere + gizli pencere) giriş yap. Birinden mesaj yaz, diğerinde F5 olmadan görünmeli. Gönderenin ekranında mesaj bir kez görünmeli.

## Hata ayıklama rehberi

| Belirti | Bakılacak yer |
|---|---|
| WebSocket bağlanmıyor | `reverb:start` çalışıyor mu, `frontend/.env` doğru mu, `npm run dev` yeniden başladı mı |
| `/broadcasting/auth` 401 | Giriş yapılmış mı, `withBroadcasting` middleware'inde `api` var mı (oturum başlamıyor olabilir), istek `authorizer` ile `api` örneği üzerinden mi gidiyor |
| `/broadcasting/auth` 419 | CSRF başlığı gitmiyor: `authorizer` içinde ham axios/pusher değil `api` örneği kullanılmalı (`withXSRFToken: true`) |
| `/broadcasting/auth` 403 | `routes/channels.php`'deki kanal kuralı reddediyor |
| `/broadcasting/auth` CORS hatası | `config/cors.php` → `paths` |
| Kendi mesajın iki kere görünüyor | `X-Socket-ID` başlığı isteğe gidiyor mu (Network sekmesi) |
| Mesaj hiç yayınlanmıyor | Event `ShouldBroadcast` ise `queue:work` çalışıyor mu, `ShouldBroadcastNow` ise `BROADCAST_CONNECTION=reverb` mi |
| POST 500 | `storage/logs/laravel.log` |

Tarayıcıda Network → WS sekmesinde `127.0.0.1:8080` bağlantısının açık olduğu ve `pusher:connection_established` mesajının geldiği görülebilir.


