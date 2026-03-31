# Task Management App

Full-stack task management app with:

- Backend: NestJS + Prisma + PostgreSQL + Redis + Socket.IO
- Frontend: React + Vite + TanStack Router + React Query

## Prerequisites

Install these before starting:

1. Node.js 20+
2. pnpm (`npm i -g pnpm`)
3. Docker Desktop (for PostgreSQL and Redis)

## 1. Clone Repository

```bash
git clone https://github.com/aditokmo/task-management.git
cd task-management
```

## 2. Start Infrastructure (Postgres + Redis)

From the `backend` folder:

```bash
cd backend
docker compose up -d
```

This starts:

- PostgreSQL on `localhost:55432`
- Redis on `localhost:6379`

## 3. Configure Backend Environment

In `backend`, create `.env` from `.env.example`:

```bash
cp .env.example .env
```

If `cp` is not available on Windows PowerShell, copy manually.

Default example values are already set for local Docker setup:

```env
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/task_management
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change_me_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

Update JWT secrets to secure values for real environments.

## 4. Install Backend Dependencies and Prepare Database

From `backend`:

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
```

## 5. Run Backend

From `backend`:

```bash
pnpm start:dev
```

Backend runs on `http://localhost:8000`.

## 6. Install and Run Frontend

Open a second terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:5173`.

### Optional Frontend Environment

Frontend has working defaults, but you can create `frontend/.env` for explicit config:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

## 7. Open the App

Open `http://localhost:5173` and use register/login to start managing tasks.

## Daily Development Startup

After initial setup, use this flow:

1. Start infrastructure:

```bash
cd backend
docker compose up -d
```

2. Start backend:

```bash
pnpm start:dev
```

3. Start frontend in another terminal:

```bash
cd frontend
pnpm dev
```
