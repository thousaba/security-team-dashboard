# SOC Team Panel

A management panel for a security team, built with a Laravel API and a React frontend. It is a practice project made for learning Laravel and React.

## Features

- Token-based login and logout (Laravel Sanctum)
- Role-based authorization: adding, deleting and updating users is limited to the `admin` role
- User management: list, create, edit roles, filter by role
- Role distribution statistics cards
- Profile page: update name and password
- Notifications: list and mark as read
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

- **Backend:** PHP 8.3+, Laravel 13, Laravel Sanctum, PostgreSQL
- **Frontend:** React 19, React Router 7, Vite, Tailwind CSS 4, Axios

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

```bash
cd frontend
npm install
npm run dev
```

The frontend talks to the API at `http://localhost:8000/api`, set in `frontend/src/api.js`.

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
| POST | `/users` | admin |
| PUT | `/users/{user}` | admin |
| DELETE | `/users/{user}` | admin |

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
