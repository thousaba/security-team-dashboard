# SOC Team Panel

A management panel for a security team, built with a Laravel API and a React frontend. It is a practice project made for learning Laravel and React.

## Features

- Token-based login and logout (Laravel Sanctum)
- Role-based authorization: adding, deleting and updating users is limited to the `admin` role
- User management: list, create, edit roles, filter by role
- Role distribution statistics cards
- Profile page: update name and password
- Notifications: list and mark as read
- Real-time group chat: one shared room for all logged-in users, delivered over WebSockets (Laravel Reverb)
- Light and dark theme

## Roles

| Role | Department |
|---|---|
| `admin` | none |
| `soc_analyst` | SOC / Threat Hunting |
| `detection_engineer` | SOC / Threat Hunting |
| `malware_analyst` | Malware Analysis |
| `standard_user` | Human Resources |
| `software_developer` | Software Development |

A user can have more than one role.

## Tech stack

- **Backend:** PHP 8.3+, Laravel 13, Laravel Sanctum, Laravel Reverb (WebSocket server), PostgreSQL
- **Frontend:** React 19, React Router 7, Vite, Axios, Laravel Echo

## Requirements

- PHP 8.3 or higher and Composer
- Node.js and npm
- PostgreSQL (roles are stored in a `jsonb` column and queried with JSON queries, so SQLite will not work)

## Setup

### 1. Backend

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Update the database settings in `.env` with your own PostgreSQL credentials:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=beginner
DB_USERNAME=postgres
DB_PASSWORD=
```

Create the `beginner` database in PostgreSQL, then create the tables:

```bash
php artisan migrate
```

Start the API (`http://localhost:8000`):

```bash
php artisan serve
```

Start the WebSocket server (Reverb, `127.0.0.1:8080`) in a second terminal. The chat needs it to deliver messages in real time:

```bash
php artisan reverb:start
```

The Reverb settings (`REVERB_*`) and `BROADCAST_CONNECTION=reverb` are already added to `.env` by `php artisan install:broadcasting`. If you set the project up from scratch, make sure they exist in your `.env` too.

### 2. First admin user

The project ships without sample data. Create an admin so you can log in:

```bash
php artisan tinker
```

```php
App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => 'password',
    'roles' => [App\Enums\UserRole::Admin],
]);
```

The password is hashed automatically. You can change it later from the Profile page.

### 3. Frontend

Create `frontend/.env` with the Reverb connection values. The frontend is a separate Vite project, so it does not read the root `.env`, and `${...}` references are not resolved. Copy the real values, with `REVERB_APP_KEY` from the root `.env`:

```env
VITE_REVERB_APP_KEY=your-reverb-app-key
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Use `127.0.0.1` instead of `localhost`. `localhost` can resolve to the IPv6 address `::1` first, and Reverb only listens on IPv4.

```bash
cd frontend
npm install
npm run dev
```

Restart `npm run dev` whenever you change `frontend/.env`.

The frontend talks to the API at `http://localhost:8000/api`, set in `frontend/src/api.js`.

To try the chat, log in as two different users (for example one normal window and one private window) and send a message from one of them. It should appear in the other without a refresh.

## API endpoints

All endpoints live under `/api`. Every endpoint except login needs an `Authorization: Bearer <token>` header.

| Method | Path | Access |
|---|---|---|
| POST | `/login` | anyone |
| POST | `/logout` | authenticated |
| GET | `/users` | authenticated |
| GET | `/options` | authenticated |
| GET | `/stats` | authenticated |
| GET, PUT | `/profile` | authenticated |
| GET | `/notifications` | authenticated |
| PUT | `/notifications/{id}/read` | authenticated |
| GET | `/chat` | authenticated |
| POST | `/chat` | authenticated |
| POST | `/users` | admin |
| PUT | `/users/{user}` | admin |
| DELETE | `/users/{user}` | admin |

Channel authorization for WebSockets is served outside `/api`, at `POST /broadcasting/auth` (protected with `auth:sanctum`). Messages are broadcast on the private channel `chat` with the `MessageSent` event. Chat messages cannot be deleted.

For a step-by-step write-up of how the real-time chat was built, including the problems we hit (CORS, IPv6, React StrictMode), see [websocket.md](websocket.md).

## Learning notes

The path a request takes through Laravel:

```
Browser request
      ↓
public/index.php          → entry point, everything starts here
      ↓
bootstrap/app.php         → boots the application (Laravel 11+ also configures middleware/exceptions here)
      ↓
HTTP Kernel               → runs global middleware (CORS, trim strings, etc.)
      ↓
Router                    → looks through the route files and finds the route matching the URL
      ↓
Route middleware          → route-specific middleware such as auth and throttle
      ↓
Controller (or closure)   → the actual business logic runs here
      ↓
Response                  → returned as a view, JSON, redirect, etc.
      ↓
Middleware (on the way back) → final processing on the response
      ↓
Response sent to the browser
```
