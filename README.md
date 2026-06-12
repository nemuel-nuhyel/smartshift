# SmartShift

SmartShift is a full-stack warehouse workforce management application for planning shifts, assigning operational tasks, tracking worker schedules, and handling shift swap requests. The project is designed as a practical admin/worker dashboard with a modern React interface and a Laravel REST API.

## Highlights

- Role-based access for administrators and workers
- Admin dashboard with staffing, task, and swap request metrics
- Shift creation, editing, capacity tracking, and worker assignments
- Drag-and-drop planner for assigning workers to shift columns
- Task creation, priority/status tracking, and worker task assignment
- Worker schedule view with assigned shifts and task workload
- Shift swap request workflow with worker response and admin approval
- Responsive Tailwind UI for desktop, tablet, and mobile

## Tech Stack

**Frontend**

- React 19
- Vite 8
- Tailwind CSS 4
- React Router
- TanStack Query
- React Hook Form
- Zod
- dnd-kit

**Backend**

- PHP 8.3
- Laravel 13
- Laravel Sanctum
- SQLite
- Eloquent ORM

## Project Structure

```text
submission_phase2/
|-- client/                 # React/Vite single-page app
|   |-- src/
|   |   |-- components/     # Shared UI and layout components
|   |   |-- context/        # Authentication context
|   |   |-- lib/            # API and formatting helpers
|   |   `-- pages/          # Route-level React pages
|   `-- package.json
|-- server/                 # Laravel REST API
|   |-- app/
|   |   |-- Http/Controllers/Api/
|   |   |-- Models/
|   |   `-- Support/
|   |-- database/
|   |   |-- migrations/
|   |   `-- seeders/
|   |-- routes/
|   `-- composer.json
`-- README.md
```

## Getting Started

### Prerequisites

- PHP 8.3+
- Composer
- Node.js and npm
- SQLite support enabled for PHP

### 1. Clone The Repository

```bash
git clone <repository-url>
cd submission_phase2
```

### 2. Set Up The Backend

```bash
cd server
composer install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Generate the application key:

```bash
php artisan key:generate
```

Create the SQLite database file if it does not already exist:

```bash
touch database/database.sqlite
```

On Windows PowerShell:

```powershell
New-Item -ItemType File database/database.sqlite -Force
```

Run migrations and seed demo data:

```bash
php artisan migrate --force
php artisan db:seed --force
```

Start the API server:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### 3. Set Up The Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs at:

```text
http://127.0.0.1:5173
```

The Vite dev server proxies API and Sanctum requests to:

```text
http://127.0.0.1:8000
```

## Demo Account

After seeding the database, use:

```text
Email:    admin@smartshift.test
Password: password
Role:     admin
```

The seeder also creates worker accounts such as:

```text
alice@smartshift.test
ben@smartshift.test
carla@smartshift.test
david@smartshift.test
```

Each seeded user uses the password:

```text
password
```

## Main Routes

Frontend routes:

- `/` - landing page
- `/login` - login
- `/register` - worker registration
- `/dashboard` - admin or worker dashboard
- `/planner` - drag-and-drop shift planner
- `/shifts` - shift management and assigned shifts
- `/tasks` - task management and task workload
- `/my-schedule` - schedule view
- `/swap-requests` - shift swap workflow
- `/users` - user management

API routes are prefixed with:

```text
/api/v1
```

Core API areas:

- Authentication: `/register`, `/login`, `/logout`, `/user`
- Dashboard: `/dashboard`
- Planner: `/planner`, `/planner/assignments/reorder`
- Users: `/users`
- Shifts: `/shifts`, `/shift-assignments`
- Tasks: `/tasks`, `/task-assignments`
- Swap requests: `/shift-swap-requests`

## Available Scripts

Frontend:

```bash
npm run dev       # start Vite development server
npm run build     # create production build
npm run preview   # preview production build
```

Backend:

```bash
php artisan serve         # start Laravel development server
php artisan migrate       # run migrations
php artisan db:seed       # seed demo data
php artisan test          # run backend tests
```

Composer convenience scripts:

```bash
composer run-script setup
composer run-script dev
composer run-script test
```

## Key Workflows

### Administrator

Administrators can create shifts, assign workers, create tasks, manage task assignments, approve swap requests, and manage user roles. The planner board validates capacity and overlapping shifts before sending updates to the API.

### Worker

Workers can view their assigned shifts, track assigned tasks, update allowed task status values, request shift swaps, and respond to incoming swap requests.

## Design Notes

The frontend uses Tailwind CSS only, with shared React components for panels, metrics, form controls, badges, and app layout. The dashboard is responsive across desktop and mobile.

## Security And Validation

- Laravel Sanctum handles API token authentication.
- Admin-only routes are protected in the frontend and backend.
- Server-side validation protects shift, task, assignment, and swap workflows.
- Shift assignment rules prevent capacity overflow and overlapping worker assignments.
- Task assignment is restricted to workers assigned to the related shift.


```bash
cd client
npm run build
```


## Author

Nemuel Nuhyel Laushi
