# Chat App Backend

Standalone backend service for authentication, chat, and realtime features.

## Architecture

This project uses a modular architecture under `src/modules/*` with dedicated layers:
- `*.routes.js`: HTTP route definitions
- `*.controller.js`: Request/response orchestration
- `*.service.js`: Business logic
- `*.schema.js`: Zod request validation

Core setup:
- Express + MongoDB + Redis
- JWT authentication (access + refresh)
- Socket.io bootstrapped in `server.js`

Redis is optional for local or Render deployments. If `REDIS_URL` is not set, refresh-token persistence falls back to in-memory-only behavior for the current process.

## Getting Started

1. Copy env file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run in development:

```bash
npm run dev
```

Server runs by default on `http://localhost:4000`.

## Auth APIs

Base path: `/api/auth`

- `POST /signup`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /refresh`
- `GET /me`
